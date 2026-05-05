export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import ConsultoriaAdmin from './ConsultoriaAdmin'

export interface ClienteConsultoria {
  user_id: string
  nome: string
  email: string
  nicho: string
  plano: string | null
  tipos: ('fp' | 'nicho')[]
}

export default async function ConsultoriaPage() {
  const supabase = createAdminClient()

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map(users.map(u => [u.id, u.email ?? '']))

  const { data: barbearias } = await supabase
    .from('barbearias')
    .select('id, nome, user_id, nicho, plano')
    .order('nome')

  const { data: fpPerfis } = await supabase
    .from('fp_perfis')
    .select('id, user_id, plano')
    .order('criado_em', { ascending: false })

  const mergedMap = new Map<string, ClienteConsultoria>()

  for (const b of barbearias ?? []) {
    mergedMap.set(b.user_id, {
      user_id: b.user_id,
      nome: b.nome,
      email: emailMap.get(b.user_id) ?? '—',
      nicho: b.nicho ?? 'barbeiro',
      plano: b.plano,
      tipos: ['nicho'],
    })
  }

  for (const f of fpPerfis ?? []) {
    const existing = mergedMap.get(f.user_id)
    if (existing) {
      existing.tipos = [...existing.tipos, 'fp']
    } else {
      mergedMap.set(f.user_id, {
        user_id: f.user_id,
        nome: emailMap.get(f.user_id) ?? '—',
        email: emailMap.get(f.user_id) ?? '—',
        nicho: 'fp',
        plano: f.plano,
        tipos: ['fp'],
      })
    }
  }

  const clientes = Array.from(mergedMap.values())
    .sort((a, b) => a.nome.localeCompare(b.nome))

  return <ConsultoriaAdmin clientes={clientes} />
}
