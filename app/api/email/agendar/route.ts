import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Barbearias em trial que expiram nos próximos 3 dias
  const agora = new Date()
  const em3Dias = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000)

  const { data: barbearias, error } = await supabase
    .from('barbearias')
    .select('id, nome, trial_termina_em, user_id')
    .eq('plano', 'trial')
    .gte('trial_termina_em', agora.toISOString())
    .lte('trial_termina_em', em3Dias.toISOString())

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  if (!barbearias || barbearias.length === 0) {
    return NextResponse.json({ enviados: 0, mensagem: 'Nenhum trial a expirar nos próximos 3 dias' })
  }

  let enviados = 0
  const erros: string[] = []

  for (const barb of barbearias) {
    const { data: userData } = await supabase.auth.admin.getUserById(barb.user_id)
    const email = userData?.user?.email
    if (!email) continue

    const diasRestantes = Math.ceil(
      (new Date(barb.trial_termina_em).getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
    )

    const { error: emailError } = await resend.emails.send({
      from: 'Fatura+ <noreply@fatura-mais.pt>',
      to: email,
      subject: `O teu trial termina em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''} — Fatura+`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fcf9f3;">
          <h2 style="color: #0e4324; font-size: 22px; margin-bottom: 8px;">O teu período de trial está quase a terminar</h2>
          <p style="color: #717971; font-size: 15px; margin-bottom: 16px;">
            Olá! O trial da <strong>${barb.nome}</strong> no Fatura+ termina em <strong>${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}</strong>.
          </p>
          <p style="color: #717971; font-size: 15px; margin-bottom: 24px;">
            Para continuares a usar o Fatura+ sem interrupções, fala connosco pelo WhatsApp ou por email.
          </p>
          <a href="https://wa.me/351910000000" style="display: inline-block; background: #0e4324; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 12px;">
            Falar connosco no WhatsApp
          </a>
          <p style="color: #aaa; font-size: 12px; margin-top: 32px;">
            Fatura+ · <a href="mailto:faturamais30@gmail.com" style="color: #aaa;">faturamais30@gmail.com</a>
          </p>
        </div>
      `,
    })

    if (emailError) {
      erros.push(`${email}: ${emailError.message}`)
    } else {
      enviados++
    }
  }

  return NextResponse.json({
    enviados,
    erros: erros.length > 0 ? erros : undefined,
    total: barbearias.length,
  })
}
