import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user?.email) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const admin = createAdminClient()
  await admin
    .from('pedidos_acesso')
    .update({ estado: 'ativo' })
    .eq('email', user.email.toLowerCase())
    .in('estado', ['pendente', 'convidado'])

  return NextResponse.json({ ok: true })
}
