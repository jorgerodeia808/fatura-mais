import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { user_id, barbearia_id } = await req.json()

  if (!user_id || !barbearia_id) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Apaga dados da barbearia
  const { error: dbError } = await supabase
    .from('barbearias')
    .delete()
    .eq('id', barbearia_id)

  if (dbError) {
    console.error('Erro ao apagar barbearia:', dbError)
    return NextResponse.json({ error: 'Erro ao apagar dados' }, { status: 500 })
  }

  // Apaga auth.identities + auth.users via função SQL segura
  const { error: authError } = await supabase.rpc('eliminar_utilizador_auth', {
    p_user_id: user_id,
  })

  if (authError) {
    console.error('Erro ao apagar auth:', authError)
    return NextResponse.json({ error: 'Dados apagados mas erro ao remover auth' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
