import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'


const nichoLabel: Record<string, string> = {
  barbeiro: 'Barber+',
  nails:    'Nails+',
  lash:     'Lash+',
  tatuador: 'Tattoo+',
  fp:       'FP+',
}

const nichoFeatures: Record<string, string[]> = {
  barbeiro: ['Faturação em tempo real', 'Marcações online', 'CRM de clientes', 'Relatórios automáticos'],
  nails:    ['Faturação e despesas', 'Marcações online', 'CRM de clientes', 'Relatórios automáticos'],
  lash:     ['Faturação e despesas', 'Marcações online', 'CRM de clientes', 'Relatórios automáticos'],
  tatuador: ['Faturação e despesas', 'Marcações online', 'CRM de clientes', 'Relatórios automáticos'],
  fp:       ['Controlo de receitas e despesas', 'Orçamentos por categoria', 'Metas de poupança', 'Pagamentos recorrentes'],
}

interface NichoTheme {
  primary: string
  accent: string
  bg: string
  cardBg: string
  subtitle: string
  letterLabel: string
}

const nichoTheme: Record<string, NichoTheme> = {
  barbeiro: { primary: '#2d2d2d', accent: '#977c30', bg: '#f5f0e8', cardBg: '#f9f7f2', subtitle: 'GESTÃO DE BARBEARIA', letterLabel: 'B' },
  nails:    { primary: '#c2185b', accent: '#f48fb1', bg: '#fce4ec', cardBg: '#fdf0f4', subtitle: 'GESTÃO DE ESTÚDIO', letterLabel: 'N' },
  lash:     { primary: '#4a148c', accent: '#c9a96e', bg: '#f3e5f5', cardBg: '#f9f0fc', subtitle: 'GESTÃO DE ESTÚDIO', letterLabel: 'L' },
  tatuador: { primary: '#111111', accent: '#c62828', bg: '#f5f5f5', cardBg: '#fafafa', subtitle: 'GESTÃO DE ESTÚDIO', letterLabel: 'T' },
  fp:       { primary: '#1e3a5f', accent: '#c9a84c', bg: '#e8eef5', cardBg: '#f0f4f8', subtitle: 'FINANÇAS PESSOAIS', letterLabel: 'FP' },
  default:  { primary: '#0e4324', accent: '#c9a84c', bg: '#f5f0e8', cardBg: '#f9f7f2', subtitle: 'PLATAFORMA DE GESTÃO', letterLabel: 'F' },
}

function buildEmailHtml(plataforma: string, nicho: string | null, inviteUrl: string): string {
  const theme = (nicho && nichoTheme[nicho]) ? nichoTheme[nicho] : nichoTheme.default
  const features: string[] = (nicho ? nichoFeatures[nicho] : null) ?? nichoFeatures.barbeiro
  const featureRows = features
    .map(f => `<tr><td style="padding:6px 0;font-size:14px;color:#374151;"><span style="display:inline-block;width:20px;height:20px;background:${theme.accent}30;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:700;color:${theme.primary};margin-right:10px;vertical-align:middle;">&#10003;</span>${f}</td></tr>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Bem-vindo ao ${plataforma}</title></head>
<body style="margin:0;padding:0;background-color:${theme.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${theme.bg};">
<tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

  <!-- Logo -->
  <tr><td align="center" style="padding-bottom:24px;">
    <span style="font-size:22px;font-weight:700;color:${theme.primary};font-style:italic;font-family:Georgia,serif;">Fatura<span style="color:${theme.accent};">+</span></span>
  </td></tr>

  <!-- Card -->
  <tr><td style="background-color:#ffffff;border-radius:20px;overflow:hidden;">

    <!-- Header -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="background-color:${theme.primary};padding:36px 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 14px auto;">
      <tr><td align="center" style="background-color:rgba(255,255,255,0.15);border-radius:14px;padding:10px 20px;font-size:20px;font-weight:700;color:#ffffff;font-style:italic;font-family:Georgia,serif;">
        ${theme.letterLabel}<span style="color:${theme.accent};">+</span>
      </td></tr>
      </table>
      <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:1.5px;color:rgba(255,255,255,0.5);text-transform:uppercase;">${theme.subtitle}</p>
    </td></tr>
    </table>

    <!-- Body -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding:40px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#111827;line-height:1.3;text-align:center;">Bem-vindo ao ${plataforma}!</h1>
      <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;text-align:center;">O teu acesso foi aprovado.<br>Clica no bot&atilde;o abaixo para definires a tua password.</p>

      <!-- CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 32px auto;">
      <tr><td align="center">
        <a href="${inviteUrl}" style="display:block;padding:16px 40px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;background-color:${theme.primary};border-radius:12px;">Ativar a minha conta &rarr;</a>
      </td></tr>
      </table>

      <!-- Features -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${theme.cardBg};border-radius:14px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${theme.primary};letter-spacing:1px;text-transform:uppercase;text-align:left;">O que tens inclu&iacute;do</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${featureRows}
        </table>
      </td></tr>
      </table>

      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;text-align:center;">Este link expira em <strong style="color:#6b7280;">24 horas</strong>.<br>Se n&atilde;o pediste este acesso, podes ignorar este email.</p>
    </td></tr>
    </table>

    <!-- Footer -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="background-color:${theme.cardBg};padding:18px 40px;border-top:1px solid rgba(0,0,0,0.05);">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Fatura+ &middot; faturamais30@gmail.com</p>
    </td></tr>
    </table>

  </td></tr>
  <!-- /Card -->

</table>
</td></tr>
</table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'jorgerodeia808@gmail.com')
    .split(',').map(e => e.trim().toLowerCase())

  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { email, nicho } = await req.json()

  if (!email || !nicho) {
    return NextResponse.json({ error: 'Email e área são obrigatórios' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Usa o site URL principal como redirectTo (sempre autorizado no Supabase).
  // O auth/callback deteta o nicho e faz relay para o subdomínio correto.
  const redirectTo = `https://fatura-mais.pt/auth/callback?type=invite&nicho=${nicho}`
  const plataforma = nichoLabel[nicho] ?? 'Fatura+'

  let linkData, linkError
  ;({ data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo },
  }))

  if (linkError) {
    ;({ data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    }))
  }

  if (linkError) {
    console.error('Generate link error:', linkError)
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  const inviteUrl = linkData.properties?.action_link
  if (!inviteUrl) {
    return NextResponse.json({ error: 'Não foi possível gerar o link' }, { status: 500 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email não configurado no servidor (RESEND_API_KEY em falta)' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from: 'Fatura+ <noreply@fatura-mais.pt>',
    to: email,
    subject: `O teu acesso ao ${plataforma} está pronto`,
    html: buildEmailHtml(plataforma, nicho, inviteUrl),
  })

  if (emailError) {
    console.error('Resend error:', emailError)
    return NextResponse.json({ error: `Erro ao enviar email: ${JSON.stringify(emailError)}` }, { status: 500 })
  }

  const { data: existing } = await supabase
    .from('pedidos_acesso')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (existing) {
    await supabase.from('pedidos_acesso')
      .update({ estado: 'convidado', convidado_em: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase.from('pedidos_acesso').insert({
      email: email.toLowerCase(),
      nicho,
      estado: 'convidado',
      convidado_em: new Date().toISOString(),
    })
  }

  return NextResponse.json({ success: true })
}
