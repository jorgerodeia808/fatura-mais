import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { nome_barbearia, email, instagram } = await req.json()

  if (!nome_barbearia?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error: dbError } = await supabase
    .from('pedidos_acesso')
    .insert({
      nome_barbearia: nome_barbearia.trim(),
      email: email.trim().toLowerCase(),
      instagram: instagram?.trim() || null,
    })

  if (dbError) {
    console.error('DB error:', dbError)
    return NextResponse.json({ error: 'Erro ao guardar pedido' }, { status: 500 })
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Fatura+ <onboarding@resend.dev>',
      to: 'faturamais30@gmail.com',
      subject: `Novo pedido de acesso — ${nome_barbearia.trim()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0e4324; margin-bottom: 16px;">Novo pedido de acesso ao Fatura+</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #717971; font-size: 14px; width: 120px;">Barbearia</td>
              <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${nome_barbearia.trim()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #717971; font-size: 14px;">Email</td>
              <td style="padding: 8px 0; font-size: 14px;">${email.trim()}</td>
            </tr>
            ${instagram?.trim() ? `
            <tr>
              <td style="padding: 8px 0; color: #717971; font-size: 14px;">Instagram</td>
              <td style="padding: 8px 0; font-size: 14px;">@${instagram.trim()}</td>
            </tr>` : ''}
          </table>
          <a
            href="${process.env.NEXT_PUBLIC_APP_URL}/admin/pedidos"
            style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #0e4324; color: white; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;"
          >
            Ver no painel admin →
          </a>
        </div>
      `,
    })
  }

  return NextResponse.json({ success: true })
}
