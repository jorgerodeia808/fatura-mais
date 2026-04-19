import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { pedido_id, email } = await req.json()

  if (!pedido_id || !email) {
    return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (inviteError) {
    console.error('Invite error:', inviteError)
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  await supabase
    .from('pedidos_acesso')
    .update({ estado: 'convidado', convidado_em: new Date().toISOString() })
    .eq('id', pedido_id)

  return NextResponse.json({ success: true })
}
