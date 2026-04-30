import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ClienteFpDetalhe from './ClienteFpDetalhe'

export default async function ClienteFpDetalhePage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: perfil } = await supabase
    .from('fp_perfis')
    .select('id, user_id, plano, criado_em, subscricao_renovacao')
    .eq('id', params.id)
    .single()

  if (!perfil) notFound()

  const { data: userData } = await supabase.auth.admin.getUserById(perfil.user_id)
  const email = userData?.user?.email ?? '—'

  return <ClienteFpDetalhe perfil={perfil} email={email} />
}
