import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const { email, nome_barbearia } = await req.json()

  if (!email || !nome_barbearia) {
    return NextResponse.json({ error: 'Email e nome da barbearia são obrigatórios' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`

  let linkResult = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo },
  })

  // Se o utilizador já existe no auth, gera um magic link em vez de convite
  if (linkResult.error) {
    linkResult = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    })
  }

  if (linkResult.error) {
    console.error('Generate link error:', linkResult.error)
    return NextResponse.json({ error: linkResult.error.message }, { status: 500 })
  }

  const inviteUrl = linkResult.data.properties?.action_link

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: `"Fatura+" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'O teu acesso ao Fatura+ está pronto',
    html: `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:#0e4324;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Fatura<span style="color:#c9a84c;">+</span></p>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.65);letter-spacing:0.5px;">GESTÃO PARA BARBEARIAS</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.3;">Bem-vindo ao Fatura+!</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
              O acesso para a barbearia <strong style="color:#1a1a1a;">${nome_barbearia}</strong> foi criado.
              Clica no botão abaixo para ativares a tua conta e começares a usar o Fatura+.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="background:#0e4324;border-radius:10px;">
                  <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                    Ativar a minha conta →
                  </a>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f2;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#0e4324;letter-spacing:0.8px;text-transform:uppercase;">O que inclui o teu plano</p>
                <p style="margin:0 0 8px;font-size:14px;color:#374151;">Calendário de marcações</p>
                <p style="margin:0 0 8px;font-size:14px;color:#374151;">Faturação e despesas</p>
                <p style="margin:0 0 8px;font-size:14px;color:#374151;">CRM de clientes</p>
                <p style="margin:0 0 8px;font-size:14px;color:#374151;">Marcações online</p>
                <p style="margin:0 0 8px;font-size:14px;color:#374151;">Relatórios e análise</p>
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              Este link expira em 24 horas. Se não pediste este acesso, podes ignorar este email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f7f2;padding:20px 40px;border-top:1px solid #ede8df;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Fatura+ · faturamais30@gmail.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })

  const { data: existing } = await supabase
    .from('pedidos_acesso')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    await supabase.from('pedidos_acesso')
      .update({ estado: 'convidado', convidado_em: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase.from('pedidos_acesso').insert({
      email,
      nome_barbearia,
      instagram: null,
      estado: 'convidado',
      convidado_em: new Date().toISOString(),
    })
  }

  return NextResponse.json({ success: true })
}
