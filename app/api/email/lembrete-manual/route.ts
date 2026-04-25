import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
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

const MSG_PADRAO = 'Não podes comparecer? Avisa-nos o mais brevemente possível. Obrigado pela preferência!'

function aplicarVariaveis(
  msg: string,
  vars: { nome_cliente: string; data: string; hora: string; nome_servico: string; nome_negocio: string }
) {
  return msg
    .replace(/\[nome_cliente\]/g, vars.nome_cliente)
    .replace(/\[data\]/g, vars.data)
    .replace(/\[hora\]/g, vars.hora)
    .replace(/\[nome_servico\]/g, vars.nome_servico)
    .replace(/\[nome_negocio\]/g, vars.nome_negocio)
}

export async function POST(req: NextRequest) {
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { tipo, marcacao_id } = await req.json()

  const nicho = process.env.NEXT_PUBLIC_NICHO ?? 'barbeiro'
  const cor = NICHO_CORES[nicho] ?? NICHO_CORES.barbeiro
  const appLabel = NICHO_LABELS[nicho] ?? 'Fatura+'

  const supabase = createAdminClient()

  const { data: barb } = await supabase
    .from('barbearias')
    .select('id, nome, user_id, mensagem_lembrete_email')
    .eq('user_id', user.id)
    .single()

  if (!barb) return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  })

  // ── OWNER DIGEST (próximas 24h) ────────────────────────────────────
  if (tipo === 'owner') {
    const agora = new Date()
    const em24h = new Date(agora.getTime() + 24 * 60 * 60 * 1000)

    const { data: marcacoes } = await supabase
      .from('marcacoes')
      .select('id, cliente_nome, cliente_telemovel, cliente_email, data_hora, estado, servicos(nome, tempo_minutos)')
      .eq('barbearia_id', barb.id)
      .in('estado', ['pendente', 'confirmado'])
      .gte('data_hora', agora.toISOString())
      .lte('data_hora', em24h.toISOString())
      .order('data_hora')

    if (!marcacoes || marcacoes.length === 0) {
      return NextResponse.json({ ok: true, enviado: false, motivo: 'Sem marcações nas próximas 24h' })
    }

    const { data: userData } = await supabase.auth.admin.getUserById(user.id)
    const ownerEmail = userData?.user?.email
    if (!ownerEmail) return NextResponse.json({ error: 'Email do utilizador não encontrado' }, { status: 400 })

    const linhas = marcacoes.map(m => {
      const hora = new Date(m.data_hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
      const dataFmt = new Date(m.data_hora).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' })
      const servico = Array.isArray(m.servicos) ? m.servicos[0] : m.servicos
      const estadoBadge = m.estado === 'confirmado'
        ? `<span style="background:${cor.primary};color:#fff;font-size:11px;padding:2px 8px;border-radius:4px;">Confirmado</span>`
        : `<span style="background:#f3f4f6;color:#6b7280;font-size:11px;padding:2px 8px;border-radius:4px;">Pendente</span>`
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #ede8df;vertical-align:top;">
            <p style="margin:0;font-size:15px;font-weight:700;color:#1a1a1a;">${hora}</p>
            <p style="margin:2px 0 0;font-size:11px;color:#9ca3af;text-transform:capitalize;">${dataFmt}</p>
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #ede8df;vertical-align:top;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">${m.cliente_nome}</p>
            ${m.cliente_telemovel ? `<p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${m.cliente_telemovel}</p>` : ''}
            ${m.cliente_email ? `<p style="margin:2px 0 0;font-size:11px;color:#9ca3af;">${m.cliente_email}</p>` : ''}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #ede8df;vertical-align:top;text-align:right;">
            <p style="margin:0 0 4px;font-size:13px;color:#374151;">${servico?.nome ?? '—'}</p>
            ${estadoBadge}
          </td>
        </tr>`
    }).join('')

    const pendentes = marcacoes.filter(m => m.estado === 'pendente').length
    const confirmadas = marcacoes.filter(m => m.estado === 'confirmado').length

    await transporter.sendMail({
      from: `"${appLabel}" <${process.env.GMAIL_USER}>`,
      to: ownerEmail,
      subject: `[TESTE] ${appLabel} · ${marcacoes.length} marcação${marcacoes.length !== 1 ? 'ões' : ''} nas próximas 24h — ${barb.nome}`,
      html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:${cor.bg};">
  <div style="background:${cor.primary};padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">${appLabel.replace('+', '')}<span style="color:${cor.accent};">+</span></p>
    <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.6);">MARCAÇÕES — PRÓXIMAS 24H</p>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
    <h2 style="margin:0 0 4px;font-size:18px;color:#1a1a1a;">${barb.nome}</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Email de teste · enviado manualmente</p>
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:${cor.bg};border-radius:8px;padding:12px;text-align:center;">
        <p style="margin:0;font-size:22px;font-weight:700;color:${cor.primary};">${marcacoes.length}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Total</p>
      </div>
      ${confirmadas > 0 ? `<div style="flex:1;background:#f0fdf4;border-radius:8px;padding:12px;text-align:center;"><p style="margin:0;font-size:22px;font-weight:700;color:#166534;">${confirmadas}</p><p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Confirmadas</p></div>` : ''}
      ${pendentes > 0 ? `<div style="flex:1;background:#fffbeb;border-radius:8px;padding:12px;text-align:center;"><p style="margin:0;font-size:22px;font-weight:700;color:#92400e;">${pendentes}</p><p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Pendentes</p></div>` : ''}
    </div>
    <table style="width:100%;border-collapse:collapse;"><tbody>${linhas}</tbody></table>
    <div style="margin-top:24px;text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/marcacoes"
         style="display:inline-block;background:${cor.primary};color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Ver marcações →
      </a>
    </div>
  </div>
  <p style="text-align:center;margin-top:16px;font-size:11px;color:#9ca3af;">Enviado por ${appLabel} · Teste manual</p>
</div>`,
    })

    return NextResponse.json({ ok: true, enviado: true, marcacoes: marcacoes.length })
  }

  // ── EMAIL INDIVIDUAL AO CLIENTE ────────────────────────────────────
  if (tipo === 'cliente') {
    if (!marcacao_id) return NextResponse.json({ error: 'marcacao_id necessário' }, { status: 400 })

    const { data: m } = await supabase
      .from('marcacoes')
      .select('id, cliente_nome, cliente_email, cliente_id, data_hora, servicos(nome, tempo_minutos)')
      .eq('id', marcacao_id)
      .eq('barbearia_id', barb.id)
      .single()

    if (!m) return NextResponse.json({ error: 'Marcação não encontrada' }, { status: 404 })

    // Fallback: se não há email na marcação, busca no CRM
    let emailDestino = m.cliente_email
    if (!emailDestino && m.cliente_id) {
      const { data: crm } = await supabase
        .from('clientes').select('email').eq('id', m.cliente_id).single()
      emailDestino = crm?.email ?? null
    }

    if (!emailDestino) return NextResponse.json({ error: 'Este cliente não tem email registado. Adiciona o email na ficha do cliente (CRM).' }, { status: 400 })

    const hora = new Date(m.data_hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    const dataFmt = new Date(m.data_hora).toLocaleDateString('pt-PT', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
    })
    const servico = Array.isArray(m.servicos) ? m.servicos[0] : m.servicos
    const msgPersonalizada = barb.mensagem_lembrete_email || MSG_PADRAO
    const msgFinal = aplicarVariaveis(msgPersonalizada, {
      nome_cliente:  m.cliente_nome,
      data:          dataFmt,
      hora,
      nome_servico:  servico?.nome ?? '',
      nome_negocio:  barb.nome,
    })

    await transporter.sendMail({
      from: `"${barb.nome} via ${appLabel}" <${process.env.GMAIL_USER}>`,
      to: emailDestino,
      subject: `[TESTE] Lembrete: marcação em ${barb.nome} — ${hora}`,
      html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:${cor.bg};">
  <div style="background:${cor.primary};padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">${barb.nome}</p>
    <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.6);">LEMBRETE DE MARCAÇÃO · TESTE</p>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 20px;font-size:15px;color:#374151;">
      Olá <strong>${m.cliente_nome}</strong>,<br/>
      Este é um email de teste. Tens uma marcação agendada:
    </p>
    <div style="background:${cor.bg};border-radius:10px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#6b7280;width:40%;">Data</td>
          <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a;text-transform:capitalize;">${dataFmt}</td>
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

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'tipo inválido' }, { status: 400 })
}
