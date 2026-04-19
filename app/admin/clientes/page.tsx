import { createAdminClient } from '@/lib/supabase/admin'
import ClientesAdmin from './ClientesAdmin'

interface Barbearia {
  id: string
  nome: string
  plano: string | null
  trial_termina_em: string | null
  criado_em: string
  valor_pago_total: number | null
  metodo_pagamento: string | null
  indicado_por: string | null
  notas: string | null
}

export default async function ClientesPage() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('barbearias')
    .select('id, nome, plano, trial_termina_em, criado_em, valor_pago_total, metodo_pagamento, indicado_por, notas')
    .order('criado_em', { ascending: false })

  const barbearias = (data as unknown as Barbearia[]) ?? []

  return <ClientesAdmin barbearias={barbearias} />
}
