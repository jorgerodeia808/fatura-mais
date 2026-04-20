import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, servico_id, data_hora, cliente_nome, cliente_telemovel } = body

    if (!slug || !servico_id || !data_hora || !cliente_nome?.trim()) {
      return NextResponse.json({ erro: 'Campos obrigatórios em falta.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verificar que a barbearia existe e tem marcações online ativas
    const { data: barbearia, error: barbErr } = await supabase
      .from('barbearias')
      .select('id, nome, marcacoes_online')
      .eq('slug', slug)
      .single()

    if (barbErr || !barbearia || !barbearia.marcacoes_online) {
      return NextResponse.json({ erro: 'Barbearia não encontrada ou marcações online desativadas.' }, { status: 404 })
    }

    // Verificar que o serviço existe e pertence a esta barbearia
    const { data: servico, error: servErr } = await supabase
      .from('servicos')
      .select('id, nome, preco, tempo_minutos')
      .eq('id', servico_id)
      .eq('barbearia_id', barbearia.id)
      .eq('ativo', true)
      .single()

    if (servErr || !servico) {
      return NextResponse.json({ erro: 'Serviço inválido.' }, { status: 400 })
    }

    // Verificar disponibilidade — o slot não pode já estar ocupado
    const dataHoraInicio = new Date(data_hora)
    const dataHoraFim = new Date(dataHoraInicio.getTime() + servico.tempo_minutos * 60 * 1000)

    const { data: conflitos } = await supabase
      .from('marcacoes')
      .select('id')
      .eq('barbearia_id', barbearia.id)
      .neq('estado', 'desistencia')
      .lt('data_hora', dataHoraFim.toISOString())
      .gte('data_hora', dataHoraInicio.toISOString())

    if (conflitos && conflitos.length > 0) {
      return NextResponse.json({ erro: 'Este horário já está ocupado. Escolhe outro.' }, { status: 409 })
    }

    // Fazer match de cliente CRM por telemóvel (ou criar novo)
    let clienteId: string | null = null
    if (cliente_telemovel?.trim()) {
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('barbearia_id', barbearia.id)
        .eq('telemovel', cliente_telemovel.trim())
        .single()

      if (clienteExistente) {
        clienteId = clienteExistente.id
        // Atualizar nome se mudou
        await supabase.from('clientes').update({ nome: cliente_nome.trim() }).eq('id', clienteId)
      } else {
        const { data: novoCliente } = await supabase.from('clientes').insert({
          barbearia_id: barbearia.id,
          nome: cliente_nome.trim(),
          telemovel: cliente_telemovel.trim(),
        }).select('id').single()
        if (novoCliente) clienteId = novoCliente.id
      }
    }

    // Criar marcação
    const { data: marcacao, error: marcErr } = await supabase.from('marcacoes').insert({
      barbearia_id: barbearia.id,
      cliente_nome: cliente_nome.trim(),
      cliente_telemovel: cliente_telemovel?.trim() || null,
      cliente_id: clienteId,
      servico_id: servico.id,
      data_hora: dataHoraInicio.toISOString(),
      estado: 'pendente',
    }).select('id').single()

    if (marcErr) {
      return NextResponse.json({ erro: 'Erro ao criar marcação. Tenta novamente.' }, { status: 500 })
    }

    return NextResponse.json({ sucesso: true, marcacao_id: marcacao.id })
  } catch {
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 })
  }
}
