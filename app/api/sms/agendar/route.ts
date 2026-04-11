import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Cron job — corre todos os dias às 10:00 UTC
// Configurado em vercel.json: { "crons": [{ "path": "/api/sms/agendar", "schedule": "0 10 * * *" }] }
export async function GET(req: NextRequest) {
  // Verificar que é o Vercel Cron a chamar (ou um pedido autorizado)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const supabase = await createClient()

  // Calcular intervalo de amanhã
  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  amanha.setHours(0, 0, 0, 0)
  const amanhaFim = new Date(amanha)
  amanhaFim.setHours(23, 59, 59, 999)

  // Buscar marcações de amanhã por enviar
  const { data: marcacoes, error } = await supabase
    .from('marcacoes')
    .select('id, cliente_nome, cliente_telemovel')
    .gte('data_hora', amanha.toISOString())
    .lte('data_hora', amanhaFim.toISOString())
    .eq('sms_enviado', false)
    .neq('estado', 'desistencia')
    .not('cliente_telemovel', 'is', null)

  if (error) {
    console.error('Erro ao buscar marcações para SMS:', error)
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  if (!marcacoes || marcacoes.length === 0) {
    return NextResponse.json({ mensagem: 'Sem marcações para enviar SMS hoje', enviados: 0 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const cronSecret2 = process.env.CRON_SECRET

  let enviados = 0
  let erros = 0
  const detalhes: string[] = []

  for (const m of marcacoes) {
    try {
      const res = await fetch(`${baseUrl}/api/sms/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cronSecret2 ? { Authorization: `Bearer ${cronSecret2}` } : {}),
        },
        body: JSON.stringify({ marcacao_id: m.id }),
      })

      const data = await res.json()
      if (res.ok && data.sucesso) {
        enviados++
        detalhes.push(`✓ ${m.cliente_nome} (${m.cliente_telemovel})`)
      } else {
        erros++
        detalhes.push(`✗ ${m.cliente_nome}: ${data.erro}`)
      }
    } catch (err) {
      erros++
      detalhes.push(`✗ ${m.cliente_nome}: erro de rede`)
    }
  }

  console.log(`[SMS Cron] ${enviados} enviados, ${erros} erros. Detalhes:`, detalhes)

  return NextResponse.json({
    mensagem: `${enviados} SMS enviados, ${erros} erros`,
    enviados,
    erros,
    detalhes,
  })
}
