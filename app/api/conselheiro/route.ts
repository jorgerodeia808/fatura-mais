import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const LIMITE_DIARIO = 20

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar barbearia do utilizador
    const { data: barbearia, error: barbeariaError } = await supabase
      .from('barbearias')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (barbeariaError || !barbearia) {
      return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })
    }

    // Rate limiting: verificar limite diário
    const hoje = new Date().toISOString().split('T')[0]
    const dataReset = barbearia.ai_data_reset?.split('T')[0]

    let mensagensHoje = barbearia.ai_mensagens_hoje || 0
    if (dataReset !== hoje) {
      mensagensHoje = 0
    }

    if (mensagensHoje >= LIMITE_DIARIO) {
      return NextResponse.json(
        { error: `Limite diário de ${LIMITE_DIARIO} mensagens atingido. Volta amanhã!` },
        { status: 429 }
      )
    }

    const { mensagem, historico = [] } = await req.json()

    if (!mensagem?.trim()) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }

    // Buscar dados reais da barbearia para contexto
    const mesAtual = new Date()
    const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).toISOString()
    const ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).toISOString()

    const mesPassado = new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1)
    const primeiroDiaMesPassado = mesPassado.toISOString()
    const ultimoDiaMesPassado = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 0).toISOString()

    const [
      { data: faturacaoMes },
      { data: faturacaoMesPassado },
      { data: despesasMes },
      { data: marcacoesSemana },
      { data: servicos },
      { data: custosFixos },
    ] = await Promise.all([
      supabase.from('faturacao').select('*').eq('barbearia_id', barbearia.id).gte('data', primeiroDiaMes).lte('data', ultimoDiaMes),
      supabase.from('faturacao').select('*').eq('barbearia_id', barbearia.id).gte('data', primeiroDiaMesPassado).lte('data', ultimoDiaMesPassado),
      supabase.from('despesas').select('*').eq('barbearia_id', barbearia.id).gte('data', primeiroDiaMes).lte('data', ultimoDiaMes),
      supabase.from('marcacoes').select('*').eq('barbearia_id', barbearia.id).gte('data_hora', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('servicos').select('*').eq('barbearia_id', barbearia.id).eq('ativo', true),
      supabase.from('custos_fixos').select('*').eq('barbearia_id', barbearia.id),
    ])

    // Calcular métricas
    const receitaMes = faturacaoMes?.reduce((s, f) => s + (f.valor_total || 0), 0) || 0
    const receitaMesPassado = faturacaoMesPassado?.reduce((s, f) => s + (f.valor_total || 0), 0) || 0
    const variacaoReceita = receitaMesPassado > 0 ? ((receitaMes - receitaMesPassado) / receitaMesPassado * 100).toFixed(1) : null
    const totalDespesas = despesasMes?.reduce((s, d) => s + (d.valor || 0), 0) || 0
    const lucroLiquido = receitaMes - totalDespesas
    const margemLucro = receitaMes > 0 ? (lucroLiquido / receitaMes * 100).toFixed(1) : 0
    const gorjetas = faturacaoMes?.reduce((s, f) => s + (f.gorjeta || 0), 0) || 0
    const totalCustosFixos = custosFixos?.reduce((s, c) => s + (c.valor || 0), 0) || 0
    const breakEven = totalCustosFixos
    const totalMarcacoes = marcacoesSemana?.length || 0
    const marcacoesConfirmadas = marcacoesSemana?.filter(m => m.estado === 'confirmada').length || 0

    // Top serviços
    const servicosCount: Record<string, { nome: string; count: number; receita: number }> = {}
    faturacaoMes?.forEach(f => {
      if (!servicosCount[f.servico_id]) {
        const serv = servicos?.find(s => s.id === f.servico_id)
        servicosCount[f.servico_id] = { nome: serv?.nome || 'Desconhecido', count: 0, receita: 0 }
      }
      servicosCount[f.servico_id].count++
      servicosCount[f.servico_id].receita += f.valor_total || 0
    })
    const topServicos = Object.values(servicosCount)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 3)

    // Health Score
    const scores = []
    if (receitaMes > 0) scores.push(receitaMes >= breakEven ? 100 : (receitaMes / breakEven) * 100)
    if (margemLucro) scores.push(Math.min(100, parseFloat(margemLucro.toString()) * 2))
    if (totalMarcacoes > 0) scores.push(Math.min(100, (marcacoesConfirmadas / totalMarcacoes) * 100))
    const healthScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50

    const systemPrompt = `És o Conselheiro IA da plataforma Fatura+, um assistente financeiro especialista em barbearias portuguesas. O teu nome é "Conselheiro" e o teu objetivo é ajudar ${barbearia.nome} a crescer e otimizar o negócio.

DADOS ATUAIS DA BARBEARIA (${barbearia.nome}):

📊 MÉTRICAS DO MÊS ATUAL:
- Receita total: €${receitaMes.toFixed(2)}${variacaoReceita ? ` (${parseFloat(variacaoReceita) >= 0 ? '+' : ''}${variacaoReceita}% vs mês anterior)` : ''}
- Despesas totais: €${totalDespesas.toFixed(2)}
- Lucro líquido: €${lucroLiquido.toFixed(2)}
- Margem de lucro: ${margemLucro}%
- Gorjetas recebidas: €${gorjetas.toFixed(2)}
- Break-even mensal: €${breakEven.toFixed(2)}
- Estado face ao break-even: ${receitaMes >= breakEven ? `✅ ATINGIDO (excesso: €${(receitaMes - breakEven).toFixed(2)})` : `⚠️ FALTA €${(breakEven - receitaMes).toFixed(2)}`}

🏆 TOP SERVIÇOS DO MÊS:
${topServicos.length > 0 ? topServicos.map((s, i) => `${i + 1}. ${s.nome}: ${s.count}x (€${s.receita.toFixed(2)})`).join('\n') : 'Sem dados'}

📅 MARCAÇÕES (últimos 7 dias):
- Total: ${totalMarcacoes}
- Confirmadas: ${marcacoesConfirmadas}
- Taxa de confirmação: ${totalMarcacoes > 0 ? ((marcacoesConfirmadas / totalMarcacoes) * 100).toFixed(0) : 0}%

💡 HEALTH SCORE: ${healthScore}/100

INSTRUÇÕES:
- Responde SEMPRE em português de Portugal (não brasileiro)
- Sê direto, prático e usa linguagem simples
- Quando deres sugestões, dá valores concretos baseados nos dados reais
- Usa emojis com moderação para tornar as respostas mais legíveis
- Foca-te em ações concretas que o dono da barbearia pode tomar HOJE
- Se o negócio estiver bem, reconhece isso mas sempre sugere melhorias
- Se houver problemas, identifica-os claramente e propõe soluções específicas
- Não inventes dados — usa apenas os dados fornecidos acima`

    // Incrementar contador de mensagens
    await supabase.from('barbearias').update({
      ai_mensagens_hoje: mensagensHoje + 1,
      ai_data_reset: new Date().toISOString(),
    }).eq('id', barbearia.id)

    // Construir histórico de mensagens para contexto multi-turno
    const messages: Anthropic.MessageParam[] = [
      ...historico.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: mensagem },
    ]

    // Streaming com Anthropic SDK
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const streamResponse = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: systemPrompt,
            messages,
          })

          for await (const event of streamResponse) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error('Anthropic stream error:', msg)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Erro no conselheiro:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: barbearia } = await supabase
      .from('barbearias')
      .select('ai_mensagens_hoje, ai_data_reset')
      .eq('user_id', user.id)
      .single()

    const hoje = new Date().toISOString().split('T')[0]
    const dataReset = barbearia?.ai_data_reset?.split('T')[0]
    const mensagensHoje = dataReset === hoje ? (barbearia?.ai_mensagens_hoje || 0) : 0

    return NextResponse.json({
      mensagensHoje,
      limite: LIMITE_DIARIO,
      restantes: LIMITE_DIARIO - mensagensHoje,
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
