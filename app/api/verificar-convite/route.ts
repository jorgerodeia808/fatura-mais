import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ autorizado: false }, { status: 401 })
  }

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'jorgerodeia808@gmail.com')
    .split(',').map(e => e.trim().toLowerCase())

  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ autorizado: true })
  }

  const nicho = process.env.NEXT_PUBLIC_APP_TYPE ?? 'barbeiro'

  const { data: convite } = await supabase
    .from('pedidos_acesso')
    .select('id')
    .eq('email', user.email ?? '')
    .eq('nicho', nicho)
    .eq('estado', 'convidado')
    .maybeSingle()

  return NextResponse.json({ autorizado: !!convite })
}
