import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { user_id, barbearia_id } = await req.json()

  if (!user_id || !barbearia_id) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Apaga dados da barbearia primeiro
  const { error: dbError } = await supabase
    .from('barbearias')
    .delete()
    .eq('id', barbearia_id)

  if (dbError) {
    console.error('Erro ao apagar barbearia:', dbError)
    return NextResponse.json({ error: 'Erro ao apagar dados' }, { status: 500 })
  }

  // Apaga o utilizador do auth via REST API (mais fiável que o JS client)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
  })

  if (!authRes.ok) {
    const body = await authRes.text()
    console.error('Erro ao apagar utilizador auth:', body)
    return NextResponse.json({ error: 'Dados apagados mas erro ao remover auth' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
