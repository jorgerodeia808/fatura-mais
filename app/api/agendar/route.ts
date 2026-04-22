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

    const { data: barbearia, error: barbErr } = await supabase
      .from('barbearias')
      .select('id, nome, marcacoes_online')
      .eq('slug', slug)
      .single()

    if (barbErr || !barbearia || !barbearia.marcacoes_online) {
      return NextResponse.json({ erro: 'Barbearia não encontrada ou marcações online desativadas.' }, { status: 404 })
    }

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

    const dataHoraInicio = new Date(data_hora)
    const dataHoraFim    = new Date(dataHoraInicio.getTime() + servico.tempo_minutos * 60 * 1000)
    const dataStr        = dataHoraInicio.toISOString().split('T')[0]
    const horaInicioStr  = dataHoraInicio.toTimeString().slice(0, 5)
    const horaFimStr     = dataHoraFim.toTimeString().slice(0, 5)

    // Verificar marcações conflituosas
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

    // Verificar bloqueios de horário
    const { data: bloqueios } = await supabase
      .from('bloqueios')
      .select('hora_inicio, hora_fim')
      .eq('barbearia_id', barbearia.id)
      .eq('data', dataStr)

    for (const b of bloqueios ?? []) {
      // Há sobreposição se o slot começa antes do fim do bloqueio E acaba depois do início
      if (horaInicioStr < b.hora_fim && horaFimStr > b.hora_inicio) {
        return NextResponse.json({ erro: 'Este horário está bloqueado. Escolhe outro.' }, { status: 409 })
      }
    }

    // Match de cliente CRM por telemóvel (só aceita 9 dígitos sem espaços)
    let clienteId: string | null = null
    const telLimpo = cliente_telemovel?.trim() ?? ''
    if (telLimpo && !/^\d{9}$/.test(telLimpo)) {
      return NextResponse.json({ erro: 'Telemóvel inválido. Usa 9 dígitos sem espaços (ex: 912345678).' }, { status: 400 })
    }
    if (telLimpo) {
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('barbearia_id', barbearia.id)
        .eq('telemovel', telLimpo)
        .single()

      if (clienteExistente) {
        clienteId = clienteExistente.id
        await supabase.from('clientes').update({ nome: cliente_nome.trim() }).eq('id', clienteId)
      } else {
        const { data: novoCliente } = await supabase.from('clientes').insert({
          barbearia_id: barbearia.id,
          nome: cliente_nome.trim(),
          telemovel: telLimpo,
        }).select('id').single()
        if (novoCliente) clienteId = novoCliente.id
      }
    }

    // Criar marcação
    const { data: marcacao, error: marcErr } = await supabase.from('marcacoes').insert({
      barbearia_id:      barbearia.id,
      cliente_nome:      cliente_nome.trim(),
      cliente_telemovel: cliente_telemovel?.trim() || null,
      cliente_id:        clienteId,
      servico_id:        servico.id,
      data_hora:         dataHoraInicio.toISOString(),
      estado:            'pendente',
    }).select('id').single()

    if (marcErr) {
      return NextResponse.json({ erro: 'Erro ao criar marcação. Tenta novamente.' }, { status: 500 })
    }

    // SMS de confirmação de receção (fire-and-forget, não bloqueia resposta)
    if (cliente_telemovel?.trim()) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sms/online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marcacao_id: marcacao.id, tipo: 'recebida' }),
      }).catch(() => {})
    }

    return NextResponse.json({ sucesso: true, marcacao_id: marcacao.id })
  } catch {
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 })
  }
}
