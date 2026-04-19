import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'jorgerodeia808@gmail.com')
    .split(',').map(e => e.trim().toLowerCase())

  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { barbearia_id, dias } = await req.json()
  if (!barbearia_id || !dias || dias < 1) {
    return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: barb, error: fetchErr } = await supabase
    .from('barbearias')
    .select('trial_termina_em, plano')
    .eq('id', barbearia_id)
    .single()

  if (fetchErr || !barb) return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })

  // Se o trial já expirou, estende a partir de agora. Senão, estende a partir da data atual de expiração.
  const base = barb.trial_termina_em && new Date(barb.trial_termina_em) > new Date()
    ? new Date(barb.trial_termina_em)
    : new Date()

  const novaData = new Date(base.getTime() + dias * 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from('barbearias')
    .update({ trial_termina_em: novaData.toISOString(), plano: 'trial' })
    .eq('id', barbearia_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, nova_data: novaData.toISOString() })
}
