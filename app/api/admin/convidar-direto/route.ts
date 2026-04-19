import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { email, nome_barbearia } = await req.json()

  if (!email || !nome_barbearia) {
    return NextResponse.json({ error: 'Email e nome da barbearia são obrigatórios' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (inviteError) {
    console.error('Invite error:', inviteError)
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
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
