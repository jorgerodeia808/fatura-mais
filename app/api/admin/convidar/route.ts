import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const nichoUrl: Record<string, string> = {
  barbeiro: 'https://barbeiro.fatura-mais.pt',
  nails:    'https://nails.fatura-mais.pt',
  lash:     'https://lash.fatura-mais.pt',
  tatuador: 'https://tatuador.fatura-mais.pt',
}

const nichoLabel: Record<string, string> = {
  barbeiro: 'Barber+',
  nails:    'Nails+',
  lash:     'Lash+',
  tatuador: 'Tattoo+',
}

export async function POST(req: NextRequest) {
  const { pedido_id, email, nicho } = await req.json()

  if (!pedido_id || !email) {
    return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const baseUrl = (nicho && nichoUrl[nicho]) ?? 'https://fatura-mais.pt'
  const redirectTo = `${baseUrl}/auth/callback`
  const plataforma = (nicho && nichoLabel[nicho]) ?? 'Fatura+'

  // 1. Criar utilizador confirmado (sem enviar qualquer email pelo Supabase)
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  // Se já existe, buscar o user existente
  let userId: string | undefined
  if (createError) {
    if (createError.message.toLowerCase().includes('already')) {
      const { data: existing } = await supabase.auth.admin.listUsers()
      userId = existing?.users.find((u) => u.email === email)?.id
    } else {
      console.error('Create user error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }
  } else {
    userId = createData.user.id
  }

  if (!userId) {
    return NextResponse.json({ error: 'Não foi possível criar o utilizador' }, { status: 500 })
  }

  // 2. Gerar invite link — o utilizador será redirecionado para definir password
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo },
  })

  if (linkError) {
    console.error('Generate link error:', linkError)
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  const inviteUrl = linkData.properties?.action_link
  if (!inviteUrl) {
    return NextResponse.json({ error: 'Não foi possível gerar o link' }, { status: 500 })
  }

  // 3. Enviar via Resend (bypassa completamente o email do Supabase)
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: emailError } = await resend.emails.send({
      from: 'Fatura+ <noreply@fatura-mais.pt>',
      to: email,
      subject: `O teu acesso ao ${plataforma} está pronto`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fcf9f3;">
          <h2 style="color: #0e4324; font-size: 22px; margin-bottom: 8px;">Bem-vindo ao ${plataforma}!</h2>
          <p style="color: #717971; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            O teu acesso foi aprovado. Clica no botão abaixo para configurar a tua conta.
          </p>
          <a href="${inviteUrl}"
             style="display: inline-block; padding: 14px 28px; background: #0e4324; color: white; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600;">
            Configurar conta →
          </a>
          <p style="color: #b0a898; font-size: 12px; margin-top: 24px; line-height: 1.5;">
            Se não pediste acesso ao ${plataforma}, ignora este email.<br>
            O link expira em 24 horas.
          </p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json({ error: `Resend: ${JSON.stringify(emailError)}` }, { status: 500 })
    }
  }

  await supabase
    .from('pedidos_acesso')
    .update({ estado: 'convidado', convidado_em: new Date().toISOString() })
    .eq('id', pedido_id)

  return NextResponse.json({ success: true })
}
