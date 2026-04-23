import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const nichoUrl: Record<string, string> = {
  barbeiro: 'https://barbeiro.fatura-mais.pt',
  nails:    'https://nails.fatura-mais.pt',
  lash:     'https://lash.fatura-mais.pt',
  tatuador: 'https://tatuador.fatura-mais.pt',
}

export async function POST(req: NextRequest) {
  const { pedido_id, email, nicho } = await req.json()

  if (!pedido_id || !email) {
    return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const baseUrl = (nicho && nichoUrl[nicho]) ?? 'https://fatura-mais.pt'
  const redirectTo = `${baseUrl}/auth/callback`

  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
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
