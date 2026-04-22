import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { email, nome_barbearia } = await req.json()

  if (!email || !nome_barbearia) {
    return NextResponse.json({ error: 'Email e nome da barbearia são obrigatórios' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  })

  if (linkError) {
    console.error('Generate invite link error:', linkError)
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  const inviteUrl = linkData.properties?.action_link

  // Tentar enviar por email — se falhar, devolver o link para partilha manual
  let emailEnviado = false
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: emailError } = await resend.emails.send({
      from: 'Fatura+ <noreply@fatura-mais.pt>',
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
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a1a;">Bem-vindo ao Fatura+!</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
              O acesso para a barbearia <strong style="color:#1a1a1a;">${nome_barbearia}</strong> foi criado.
              Clica no botão abaixo para ativares a tua conta.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="background:#0e4324;border-radius:10px;">
                  <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                    Ativar a minha conta →
                  </a>
                </td>
              </tr>
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
    if (!emailError) emailEnviado = true
  } catch {
    // Email falhou — continuar com link manual
  }

  await supabase.from('pedidos_acesso').insert({
    email,
    nome_barbearia,
    instagram: null,
    estado: 'convidado',
    convidado_em: new Date().toISOString(),
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    email_enviado: emailEnviado,
    invite_url: emailEnviado ? null : inviteUrl,
  })
}
