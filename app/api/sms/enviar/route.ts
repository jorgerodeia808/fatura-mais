import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'

const SMS_TEMPLATE_PADRAO =
  'Olá [nome_cliente]! Lembrete da tua marcação em [nome_barbearia] amanhã, [data] às [hora] para [nome_servico]. Até amanhã!'

function formatarDataPT(date: Date): string {
  return date.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function normalizarTelemovel(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  // Se já tem código de país
  if (digits.startsWith('351') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('00351')) return `+${digits.slice(2)}`
  // Número PT sem código de país (9 dígitos começando em 9, 2, 3)
  if (digits.length === 9 && /^[923]/.test(digits)) return `+351${digits}`
  // Assume que já tem + na frente
  if (tel.startsWith('+')) return tel
  return `+${digits}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Autenticação: aceita pedidos do cron (CRON_SECRET) ou do utilizador autenticado
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isCronRequest = cronSecret && authHeader === `Bearer ${cronSecret}`

    if (!isCronRequest) {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
      }
    }

    const { marcacao_id } = await req.json()
    if (!marcacao_id) {
      return NextResponse.json({ erro: 'marcacao_id obrigatório' }, { status: 400 })
    }

    // Buscar marcação com todos os detalhes
    const { data: marcacao, error: mErr } = await supabase
      .from('marcacoes')
      .select(`
        id,
        cliente_nome,
        cliente_telemovel,
        data_hora,
        estado,
        sms_enviado,
        servicos ( nome ),
        barbearias ( id, nome, sms_ativo, sms_mensagem_personalizada )
      `)
      .eq('id', marcacao_id)
      .single()

    if (mErr || !marcacao) {
      return NextResponse.json({ erro: 'Marcação não encontrada' }, { status: 404 })
    }

    // Verificar se SMS já foi enviado
    if (marcacao.sms_enviado) {
      return NextResponse.json({ erro: 'SMS já foi enviado para esta marcação' }, { status: 409 })
    }

    // Verificar se estado é válido para envio
    if (marcacao.estado === 'desistencia') {
      return NextResponse.json({ erro: 'Não se envia SMS para desistências' }, { status: 422 })
    }

    const barbearia = marcacao.barbearias as unknown as { id: string; nome: string; sms_ativo: boolean; sms_mensagem_personalizada: string | null } | null
    const servico = marcacao.servicos as unknown as { nome: string } | null

    // Verificar se SMS está ativo na barbearia
    if (barbearia && barbearia.sms_ativo === false) {
      return NextResponse.json({ erro: 'SMS desativado nesta barbearia' }, { status: 422 })
    }

    // Validar telemóvel
    if (!marcacao.cliente_telemovel?.trim()) {
      return NextResponse.json({ erro: 'Cliente não tem telemóvel registado' }, { status: 422 })
    }

    const telNormalizado = normalizarTelemovel(marcacao.cliente_telemovel)
    if (telNormalizado.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ erro: 'Formato de telemóvel inválido' }, { status: 422 })
    }

    // Verificar credenciais Twilio
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!sid || !token || !fromNumber) {
      return NextResponse.json({ erro: 'Twilio não configurado. Adiciona as credenciais no .env.local' }, { status: 503 })
    }

    // Construir mensagem
    const dataHora = new Date(marcacao.data_hora)
    const hora = dataHora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    const data = formatarDataPT(dataHora)
    const template = barbearia?.sms_mensagem_personalizada || SMS_TEMPLATE_PADRAO
    const mensagem = template
      .replace('[nome_cliente]', marcacao.cliente_nome)
      .replace('[nome_barbearia]', barbearia?.nome || 'a barbearia')
      .replace('[data]', data)
      .replace('[hora]', hora)
      .replace('[nome_servico]', servico?.nome || 'o serviço')

    // Enviar SMS via Twilio
    const client = twilio(sid, token)
    await client.messages.create({
      body: mensagem,
      from: fromNumber,
      to: telNormalizado,
    })

    // Atualizar marcação: sms_enviado = true
    await supabase
      .from('marcacoes')
      .update({ sms_enviado: true, sms_enviado_em: new Date().toISOString() })
      .eq('id', marcacao_id)

    return NextResponse.json({ sucesso: true, destinatario: telNormalizado })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Erro ao enviar SMS:', msg)
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
