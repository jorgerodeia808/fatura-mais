import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createAdminClient } from '@/lib/supabase/admin'

// Templates padrão (usados se o barbeiro não personalizou)
const TEMPLATES_PADRAO = {
  recebida:   'Olá [nome_cliente]! A tua marcação em [nome_barbearia] para [nome_servico] no dia [data] às [hora] foi recebida. Aguarda confirmação.',
  confirmada: 'Olá [nome_cliente]! A tua marcação em [nome_barbearia] para [nome_servico] no dia [data] às [hora] está confirmada. Até já!',
  cancelada:  'Olá [nome_cliente]! Infelizmente não te conseguimos atender no dia [data] às [hora] em [nome_barbearia]. Agenda outro horário: [link_marcacoes]',
}

function formatarDataPT(date: Date): string {
  return date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
}

function normalizarTelemovel(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  if (digits.startsWith('351') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('00351')) return `+${digits.slice(2)}`
  if (digits.length === 9 && /^[923]/.test(digits)) return `+351${digits}`
  if (tel.startsWith('+')) return tel
  return `+${digits}`
}

export async function POST(req: NextRequest) {
  try {
    const { marcacao_id, tipo } = await req.json()

    if (!marcacao_id || !['recebida', 'confirmada', 'cancelada'].includes(tipo)) {
      return NextResponse.json({ erro: 'Parâmetros inválidos.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: marcacao, error: mErr } = await supabase
      .from('marcacoes')
      .select(`
        id, cliente_nome, cliente_telemovel, data_hora,
        servicos ( nome ),
        barbearias ( id, nome, slug, sms_ativo, sms_reserva_recebida, sms_reserva_confirmada, sms_reserva_cancelada )
      `)
      .eq('id', marcacao_id)
      .single()

    if (mErr || !marcacao) {
      return NextResponse.json({ erro: 'Marcação não encontrada.' }, { status: 404 })
    }

    const barbearia = marcacao.barbearias as unknown as {
      id: string; nome: string; slug: string | null; sms_ativo: boolean | null
      sms_reserva_recebida: string | null; sms_reserva_confirmada: string | null; sms_reserva_cancelada: string | null
    } | null

    // Verificar se SMS está ativo
    if (barbearia?.sms_ativo === false) {
      return NextResponse.json({ ignorado: true, motivo: 'SMS desativado.' })
    }

    if (!marcacao.cliente_telemovel?.trim()) {
      return NextResponse.json({ ignorado: true, motivo: 'Sem telemóvel.' })
    }

    const sid   = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from  = process.env.TWILIO_PHONE_NUMBER

    if (!sid || !token || !from ||
        sid.startsWith('SUBSTITUI') || token.startsWith('SUBSTITUI')) {
      return NextResponse.json({ ignorado: true, motivo: 'Twilio não configurado.' })
    }

    const dataHora = new Date(marcacao.data_hora)
    const hora     = dataHora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    const data     = formatarDataPT(dataHora)
    const servico  = marcacao.servicos as unknown as { nome: string } | null
    const linkMarcacoes = barbearia?.slug
      ? `https://www.fatura-mais.pt/agendar/${barbearia.slug}`
      : 'https://www.fatura-mais.pt'

    const templateBase =
      tipo === 'recebida'   ? (barbearia?.sms_reserva_recebida   || TEMPLATES_PADRAO.recebida)   :
      tipo === 'confirmada' ? (barbearia?.sms_reserva_confirmada || TEMPLATES_PADRAO.confirmada) :
                               (barbearia?.sms_reserva_cancelada  || TEMPLATES_PADRAO.cancelada)

    const mensagem = templateBase
      .replace(/\[nome_cliente\]/g,   marcacao.cliente_nome)
      .replace(/\[nome_barbearia\]/g, barbearia?.nome || 'a barbearia')
      .replace(/\[data\]/g,           data)
      .replace(/\[hora\]/g,           hora)
      .replace(/\[nome_servico\]/g,   servico?.nome || 'o serviço')
      .replace(/\[link_marcacoes\]/g, linkMarcacoes)

    const telNormalizado = normalizarTelemovel(marcacao.cliente_telemovel)
    const client = twilio(sid, token)
    await client.messages.create({ body: mensagem, from, to: telNormalizado })

    return NextResponse.json({ sucesso: true, destinatario: telNormalizado })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Erro SMS online:', msg)
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
