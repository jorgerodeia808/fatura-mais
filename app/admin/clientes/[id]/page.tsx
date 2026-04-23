import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ClienteDetalhe from './ClienteDetalhe'

export default async function ClienteDetalhePage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: barb } = await supabase
    .from('barbearias')
    .select('id, nome, plano, criado_em, valor_pago_total, metodo_pagamento, indicado_por, notas, num_barbeiros, hora_abertura, hora_fecho, dias_trabalho_mes, user_id, subscricao_inicio, subscricao_renovacao')
    .eq('id', params.id)
    .single()

  if (!barb) notFound()

  const { data: userData } = await supabase.auth.admin.getUserById(barb.user_id)
  const email = userData?.user?.email ?? '—'

  const { data: pagamentos } = await supabase
    .from('pagamentos_recebidos')
    .select('id, valor, metodo, data, notas, criado_em')
    .eq('barbearia_id', barb.id)
    .order('data', { ascending: false })
    .limit(10)

  return (
    <ClienteDetalhe
      barbearia={barb}
      email={email}
      pagamentos={pagamentos ?? []}
    />
  )
}
