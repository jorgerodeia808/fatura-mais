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

  const { barbearia_id, plano, notas } = await req.json()
  if (!barbearia_id || !plano) {
    return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })
  }

  const planosValidos = ['trial', 'mensal', 'vitalicio', 'suspenso']
  if (!planosValidos.includes(plano)) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const updates: Record<string, unknown> = { plano }
  if (notas !== undefined) updates.notas = notas

  const { error } = await supabase.from('barbearias').update(updates).eq('id', barbearia_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
