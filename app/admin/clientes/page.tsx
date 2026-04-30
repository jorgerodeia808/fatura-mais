export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import ClientesAdmin from './ClientesAdmin'

export interface ClienteUnificado {
  id: string
  nome: string
  email: string
  plano: string | null
  nicho: string
  criado_em: string
  valor_pago_total: number | null
  metodo_pagamento: string | null
  indicado_por: string | null
  notas: string | null
}

export default async function ClientesPage() {
  const supabase = createAdminClient()

  // Buscar todos os utilizadores auth para mapear user_id → email
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map(users.map(u => [u.id, u.email ?? '']))

  // Barbearias (todos os nichos exceto fp)
  const { data: barbearias } = await supabase
    .from('barbearias')
    .select('id, nome, plano, criado_em, valor_pago_total, metodo_pagamento, indicado_por, notas, nicho, user_id')
    .order('criado_em', { ascending: false })

  // Clientes FP+
  const { data: fpPerfis } = await supabase
    .from('fp_perfis')
    .select('id, user_id, plano, criado_em')
    .order('criado_em', { ascending: false })

  const clientes: ClienteUnificado[] = [
    ...(barbearias ?? []).map(b => ({
      id: b.id,
      nome: b.nome,
      email: emailMap.get(b.user_id) ?? '—',
      plano: b.plano,
      nicho: b.nicho ?? 'barbeiro',
      criado_em: b.criado_em,
      valor_pago_total: b.valor_pago_total,
      metodo_pagamento: b.metodo_pagamento,
      indicado_por: b.indicado_por,
      notas: b.notas,
    })),
    ...(fpPerfis ?? []).map(f => ({
      id: f.id,
      nome: emailMap.get(f.user_id) ?? '—',
      email: emailMap.get(f.user_id) ?? '—',
      plano: f.plano,
      nicho: 'fp',
      criado_em: f.criado_em,
      valor_pago_total: null,
      metodo_pagamento: null,
      indicado_por: null,
      notas: null,
    })),
  ].sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())

  return <ClientesAdmin clientes={clientes} />
}
