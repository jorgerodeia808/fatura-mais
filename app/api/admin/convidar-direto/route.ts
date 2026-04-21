import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { email, nome_barbearia } = await req.json()

  if (!email || !nome_barbearia) {
    return NextResponse.json({ error: 'Email e nome da barbearia são obrigatórios' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Gerar link de convite sem enviar email pelo Supabase
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

  // Enviar email via Resend
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from: 'Fatura+ <noreply@fatura-mais.pt>',
    to: email,
    subject: 'O teu acesso ao Fatura+ está pronto',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fcf9f3;">
        <h2 style="color: #0e4324; font-size: 22px; margin-bottom: 8px;">Bem-vindo ao Fatura+!</h2>
        <p style="color: #717971; font-size: 15px; margin-bottom: 16px;">
          A tua barbearia <strong>${nome_barbearia}</strong> foi registada no Fatura+.
          Clica no botão abaixo para ativar a tua conta.
        </p>
        <a href="${inviteUrl}"
           style="display: inline-block; background: #0e4324; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 24px;">
          Ativar conta →
        </a>
        <p style="color: #aaa; font-size: 12px;">
          Este link expira em 24 horas. Se não pediste este acesso, ignora este email.
        </p>
        <p style="color: #aaa; font-size: 12px; margin-top: 16px;">
          Fatura+ · <a href="mailto:faturamais30@gmail.com" style="color: #aaa;">faturamais30@gmail.com</a>
        </p>
      </div>
    `,
  })

  if (emailError) {
    console.error('Resend error:', emailError)
    return NextResponse.json({ error: emailError.message }, { status: 500 })
  }

  await supabase.from('pedidos_acesso').insert({
    email,
    nome_barbearia,
    instagram: null,
    estado: 'convidado',
    convidado_em: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
