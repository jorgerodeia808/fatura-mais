import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function AuthenticadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: barbearia } = await supabase
    .from('barbearias')
    .select('nome')
    .eq('user_id', user.id)
    .single()

  const userName =
    user.user_metadata?.nome_completo ?? user.email ?? 'Utilizador'
  const barbeariaName = barbearia?.nome ?? 'A minha barbearia'

  return (
    <div className="flex min-h-screen bg-[#f7f5f0]">
      <Sidebar userName={userName} barbeariaName={barbeariaName} />
      <main className="flex-1 min-w-0 lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  )
}
