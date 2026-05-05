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

  const { user_id, barbearia_id } = await req.json()

  if (!user_id) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Apaga dados da barbearia (apenas para nichos — FP+ não tem barbearia_id)
  if (barbearia_id) {
    const { error: dbError } = await supabase
      .from('barbearias')
      .delete()
      .eq('id', barbearia_id)

    if (dbError) {
      console.error('Erro ao apagar barbearia:', dbError)
      return NextResponse.json({ error: 'Erro ao apagar dados' }, { status: 500 })
    }
  }

  // Apaga auth.identities + auth.users via função SQL segura (cascata apaga fp_perfis, fp_transacoes, etc.)
  const { error: authError } = await supabase.rpc('eliminar_utilizador_auth', {
    p_user_id: user_id,
  })

  if (authError) {
    console.error('Erro ao apagar auth:', authError)
    return NextResponse.json({ error: 'Dados apagados mas erro ao remover auth' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
