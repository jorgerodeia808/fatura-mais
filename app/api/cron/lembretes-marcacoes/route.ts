import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'

const NICHO_CORES: Record<string, { primary: string; accent: string; bg: string }> = {
  barbeiro: { primary: '#0e4324', accent: '#977c30', bg: '#f5f0e8' },
  nails:    { primary: '#DB2777', accent: '#F472B6', bg: '#fff0f6' },
  lash:     { primary: '#3B0764', accent: '#D8B4FE', bg: '#faf5ff' },
  tatuador: { primary: '#111827', accent: '#6B7280', bg: '#f9fafb' },
}

const NICHO_LABELS: Record<string, string> = {
  barbeiro: 'Barber+',
  nails:    'Nails+',
  lash:     'Lash+',
  tatuador: 'Tatuador+',
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const nicho = process.env.NEXT_PUBLIC_NICHO ?? 'barbeiro'
  const cor = NICHO_CORES[nicho] ?? NICHO_CORES.barbeiro
  const appLabel = NICHO_LABELS[nicho] ?? 'Fatura+'

  const supabase = createAdminClient()

  // Amanhã em UTC: 00:00:00 → 23:59:59
  const agora = new Date()
  const amanha = new Date(agora)
  amanha.setUTCDate(amanha.getUTCDate() + 1)
  amanha.setUTCHours(0, 0, 0, 0)
  const amanhaFim = new Date(amanha)
  amanhaFim.setUTCHours(23, 59, 59, 999)

  // Buscar marcações de amanhã ainda não notificadas
  const { data: marcacoes, error } = await supabase
    .from('marcacoes')
    .select(`
      id,
      barbearia_id,
      cliente_nome,
      cliente_telemovel,
      cliente_email,
      cliente_id,
      data_hora,
      estado,
      barbearias ( id, nome, user_id, mensagem_lembrete_email ),
      servicos ( nome, tempo_minutos )
    `)
    .in('estado', ['pendente', 'confirmado'])
    .eq('email_lembrete_enviado', false)
    .gte('data_hora', amanha.toISOString())
    .lte('data_hora', amanhaFim.toISOString())
    .order('data_hora', { ascending: true })

  if (error) {
    console.error('[lembretes-marcacoes] Erro ao buscar marcações:', error)
    return NextResponse.json({ error: 'Erro ao buscar marcações' }, { status: 500 })
  }

  if (!marcacoes || marcacoes.length === 0) {
    return NextResponse.json({ ok: true, enviado: 0, motivo: 'Sem marcações amanhã' })
  }

  // Fallback: para marcações sem cliente_email, buscar email no CRM
  const semEmail = marcacoes.filter(m => !m.cliente_email && m.cliente_id)
  if (semEmail.length > 0) {
    const ids = semEmail.map(m => m.cliente_id as string)
    const { data: crmEmails } = await supabase
      .from('clientes').select('id, email').in('id', ids)
    const emailMap = new Map((crmEmails ?? []).map(c => [c.id, c.email]))
    for (const m of marcacoes) {
      if (!m.cliente_email && m.cliente_id && emailMap.get(m.cliente_id)) {
        m.cliente_email = emailMap.get(m.cliente_id) ?? null
      }
    }
  }

  type MItem = (typeof marcacoes)[number]

  // Agrupar por barbearia
  const porBarbearia = new Map<string, MItem[]>()
  for (const m of marcacoes) {
    const barb = Array.isArray(m.barbearias) ? m.barbearias[0] : m.barbearias
    if (!barb) continue
    const lista = porBarbearia.get(barb.id) ?? []
    lista.push(m)
    porBarbearia.set(barb.id, lista)
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  })

  const dataAmanha = amanha.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  let totalEnviados = 0
  const idsNotificados: string[] = []

  for (const [barbId, lista] of Array.from(porBarbearia.entries())) {
    const barb = Array.isArray(lista[0].barbearias) ? lista[0].barbearias[0] : lista[0].barbearias
    if (!barb?.user_id) continue

    // Obter email do dono via auth
    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(barb.user_id)
    if (userErr || !userData?.user?.email) continue

    const ownerEmail = userData.user.email

    const linhasMarcacoes = lista.map((m: MItem) => {
      const hora = new Date(m.data_hora).toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      })
      const servico = Array.isArray(m.servicos) ? m.servicos[0] : m.servicos
      const nomeServico = servico?.nome ?? '—'
      const duracaoMin = servico?.tempo_minutos ?? 0
      const estadoBadge = m.estado === 'confirmado'
        ? `<span style="background:${cor.primary};color:#fff;font-size:11px;padding:2px 8px;border-radius:4px;">Confirmado</span>`
        : `<span style="background:#f3f4f6;color:#6b7280;font-size:11px;padding:2px 8px;border-radius:4px;">Pendente</span>`

      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #ede8df;vertical-align:top;">
            <p style="margin:0;font-size:15px;font-weight:700;color:#1a1a1a;">${hora}</p>
            ${duracaoMin ? `<p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">${duracaoMin} min</p>` : ''}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #ede8df;vertical-align:top;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">${m.cliente_nome}</p>
            ${m.cliente_telemovel ? `<p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${m.cliente_telemovel}</p>` : ''}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #ede8df;vertical-align:top;text-align:right;">
            <p style="margin:0 0 4px;font-size:13px;color:#374151;">${nomeServico}</p>
            ${estadoBadge}
          </td>
        </tr>
      `
    }).join('')

    const pendentes = lista.filter((m: MItem) => m.estado === 'pendente').length
    const confirmadas = lista.filter((m: MItem) => m.estado === 'confirmado').length

    await transporter.sendMail({
      from: `"${appLabel}" <${process.env.GMAIL_USER}>`,
      to: ownerEmail,
      subject: `${appLabel} · ${lista.length} marcação${lista.length !== 1 ? 'ões' : ''} amanhã — ${barb.nome}`,
      html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:${cor.bg};">
  <div style="background:${cor.primary};padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">${appLabel.replace('+', '')}<span style="color:${cor.accent};">+</span></p>
    <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.6);">MARCAÇÕES DE AMANHÃ</p>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
    <h2 style="margin:0 0 4px;font-size:18px;color:#1a1a1a;">${barb.nome}</h2>
    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:capitalize;">${dataAmanha}</p>

    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:${cor.bg};border-radius:8px;padding:12px;text-align:center;">
        <p style="margin:0;font-size:22px;font-weight:700;color:${cor.primary};">${lista.length}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Total</p>
      </div>
      ${confirmadas > 0 ? `
      <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:12px;text-align:center;">
        <p style="margin:0;font-size:22px;font-weight:700;color:#166534;">${confirmadas}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Confirmadas</p>
      </div>` : ''}
      ${pendentes > 0 ? `
      <div style="flex:1;background:#fffbeb;border-radius:8px;padding:12px;text-align:center;">
        <p style="margin:0;font-size:22px;font-weight:700;color:#92400e;">${pendentes}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Pendentes</p>
      </div>` : ''}
    </div>

    <table style="width:100%;border-collapse:collapse;">
      <tbody>${linhasMarcacoes}</tbody>
    </table>

    <div style="margin-top:24px;text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/marcacoes"
         style="display:inline-block;background:${cor.primary};color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Ver marcações →
      </a>
    </div>
  </div>
  <p style="text-align:center;margin-top:16px;font-size:11px;color:#9ca3af;">
    Enviado automaticamente por ${appLabel} · Para não receber estes emails, desativa na página de Configurações.
  </p>
</div>`,
    })

    // Enviar lembrete individual a cada cliente com email
    for (const m of lista) {
      if (!m.cliente_email) continue
      const hora = new Date(m.data_hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
      const servico = Array.isArray(m.servicos) ? m.servicos[0] : m.servicos
      const msgPersonalizada = barb.mensagem_lembrete_email ||
        'Não podes comparecer? Avisa-nos o mais brevemente possível. Obrigado pela preferência!'
      const msgFinal = msgPersonalizada
        .replace(/\[nome_cliente\]/g, m.cliente_nome)
        .replace(/\[data\]/g, dataAmanha)
        .replace(/\[hora\]/g, hora)
        .replace(/\[nome_servico\]/g, servico?.nome ?? '')
        .replace(/\[nome_negocio\]/g, barb.nome)
      await transporter.sendMail({
        from: `"${barb.nome} via ${appLabel}" <${process.env.GMAIL_USER}>`,
        to: m.cliente_email,
        subject: `Lembrete: tens uma marcação amanhã às ${hora} — ${barb.nome}`,
        html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:${cor.bg};">
  <div style="background:${cor.primary};padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">${barb.nome}</p>
    <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.6);">LEMBRETE DE MARCAÇÃO</p>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 20px;font-size:15px;color:#374151;">
      Olá <strong>${m.cliente_nome}</strong>,<br/>
      Lembramos que tens uma marcação agendada para amanhã:
    </p>
    <div style="background:${cor.bg};border-radius:10px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#6b7280;width:40%;">Data</td>
          <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a;text-transform:capitalize;">${dataAmanha}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#6b7280;">Hora</td>
          <td style="padding:6px 0;font-size:15px;font-weight:700;color:${cor.primary};">${hora}</td>
        </tr>
        ${servico ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Serviço</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a;">${servico.nome}</td></tr>` : ''}
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#6b7280;">Local</td>
          <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a;">${barb.nome}</td>
        </tr>
      </table>
    </div>
    <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${msgFinal.replace(/\n/g, '<br/>')}</p>
  </div>
  <p style="text-align:center;margin-top:16px;font-size:11px;color:#9ca3af;">Lembrete enviado por ${appLabel}</p>
</div>`,
      })
    }

    idsNotificados.push(...lista.map((m: MItem) => m.id))
    totalEnviados++
  }

  // Marcar como notificadas
  if (idsNotificados.length > 0) {
    await supabase
      .from('marcacoes')
      .update({ email_lembrete_enviado: true })
      .in('id', idsNotificados)
  }

  return NextResponse.json({ ok: true, enviado: totalEnviados, marcacoes: idsNotificados.length })
}
