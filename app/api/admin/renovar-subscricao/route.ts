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

  const { barbearia_id, fp_perfil_id, valor = 12.99, metodo = 'transferencia', notas } = await req.json()
  if (!barbearia_id && !fp_perfil_id) return NextResponse.json({ error: 'id em falta' }, { status: 400 })

  const supabase = createAdminClient()
  const now = new Date()

  if (fp_perfil_id) {
    const { data: perfil } = await supabase
      .from('fp_perfis')
      .select('subscricao_renovacao')
      .eq('id', fp_perfil_id)
      .single()

    if (!perfil) return NextResponse.json({ error: 'Perfil FP+ não encontrado' }, { status: 404 })

    const base = perfil.subscricao_renovacao && new Date(perfil.subscricao_renovacao) > now
      ? new Date(perfil.subscricao_renovacao)
      : now
    const novaRenovacao = new Date(base)
    novaRenovacao.setDate(novaRenovacao.getDate() + 30)

    await supabase.from('fp_perfis').update({
      plano: 'mensal',
      subscricao_renovacao: novaRenovacao.toISOString(),
    }).eq('id', fp_perfil_id)

    return NextResponse.json({ success: true, nova_renovacao: novaRenovacao.toISOString() })
  }

  const { data: barb } = await supabase
    .from('barbearias')
    .select('subscricao_renovacao, subscricao_inicio, valor_pago_total')
    .eq('id', barbearia_id)
    .single()

  if (!barb) return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 })

  const base = barb.subscricao_renovacao && new Date(barb.subscricao_renovacao) > now
    ? new Date(barb.subscricao_renovacao)
    : now
  const novaRenovacao = new Date(base)
  novaRenovacao.setDate(novaRenovacao.getDate() + 30)

  const updates: Record<string, unknown> = {
    plano: 'mensal',
    subscricao_renovacao: novaRenovacao.toISOString(),
    valor_pago_total: (barb.valor_pago_total ?? 0) + valor,
  }
  if (!barb.subscricao_inicio) updates.subscricao_inicio = now.toISOString()

  await supabase.from('barbearias').update(updates).eq('id', barbearia_id)

  await supabase.from('pagamentos_recebidos').insert({
    barbearia_id,
    valor,
    metodo,
    tipo: 'mensal',
    notas: notas ?? null,
    data: now.toISOString().split('T')[0],
  })

  return NextResponse.json({ success: true, nova_renovacao: novaRenovacao.toISOString() })
}
