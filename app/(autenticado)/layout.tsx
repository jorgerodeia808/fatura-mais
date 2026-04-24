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
    .select('nome, nicho, plano, subscricao_renovacao')
    .eq('user_id', user.id)
    .single()

  // Bloquear acesso se o nicho da barbearia não coincide com esta plataforma
  const plataformaNicho = process.env.NEXT_PUBLIC_NICHO
  if (plataformaNicho && barbearia?.nicho && barbearia.nicho !== plataformaNicho) {
    redirect('/plataforma-errada')
  }

  const userName =
    user.user_metadata?.nome_completo ?? user.email ?? 'Utilizador'
  const barbeariaName = barbearia?.nome ?? 'A minha barbearia'

  const renovacao = barbearia?.subscricao_renovacao as string | null
  const diasParaRenovacao = renovacao
    ? Math.ceil((new Date(renovacao).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const mostrarAviso =
    barbearia?.plano === 'mensal' &&
    diasParaRenovacao !== null &&
    diasParaRenovacao > 0 &&
    diasParaRenovacao <= 5
  const renovacaoFormatada = renovacao
    ? new Date(renovacao).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="flex min-h-screen bg-fundo">
      <Sidebar userName={userName} barbeariaName={barbeariaName} />
      <main className="flex-1 min-w-0 lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 max-w-[1400px] mx-auto">
          {mostrarAviso && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 text-sm">
              <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: '18px', color: '#b45309' }}>warning</span>
              <p>
                A tua subscrição mensal expira{' '}
                <strong>{diasParaRenovacao === 1 ? 'amanhã' : `em ${diasParaRenovacao} dias`}</strong>
                {renovacaoFormatada ? ` (${renovacaoFormatada})` : ''}.{' '}
                <a
                  href="mailto:faturamais30@gmail.com?subject=Renovação%20de%20subscrição"
                  className="font-semibold underline"
                >
                  Entra em contacto para renovar →
                </a>
              </p>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
