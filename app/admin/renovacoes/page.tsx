import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

interface Barbearia {
  id: string
  nome: string
  plano: string | null
  trial_termina_em: string | null
  criado_em: string
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function TrialDiffLabel({ iso, expired }: { iso: string | null; expired: boolean }) {
  if (!iso) return <span className="text-gray-400 italic">Sem data</span>
  const now = new Date()
  const d = new Date(iso)
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (!expired) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-gray-700">{formatDate(iso)}</span>
        <span className="text-yellow-600 text-xs font-medium">({diff}d restantes)</span>
      </span>
    )
  }

  const daysAgo = Math.abs(diff)
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-gray-700">{formatDate(iso)}</span>
      <span className="text-red-500 text-xs font-medium">
        (expirou há {daysAgo} dia{daysAgo !== 1 ? 's' : ''})
      </span>
    </span>
  )
}

function SectionTable({
  title,
  description,
  barbearias,
  expired,
  emptyMessage,
  accentColor,
}: {
  title: string
  description?: string
  barbearias: Barbearia[]
  expired: boolean
  emptyMessage: string
  accentColor: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-6 py-4 border-b border-gray-100 flex items-center gap-3`}>
        <div className={`w-2 h-2 rounded-full ${accentColor}`} />
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {barbearias.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Nome
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Trial termina
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Registo
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {barbearias.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              barbearias.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-900">{b.nome}</td>
                  <td className="px-6 py-3.5">
                    <TrialDiffLabel iso={b.trial_termina_em} expired={expired} />
                  </td>
                  <td className="px-6 py-3.5 text-gray-500">{formatDate(b.criado_em)}</td>
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/admin/clientes/${b.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0e4324] bg-[#0e4324]/10 hover:bg-[#0e4324]/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Gerir cliente →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function RenovacoesPage() {
  const supabase = createAdminClient()

  // Fetch all trial barbearias
  const { data: trialData, error: trialError } = await supabase
    .from('barbearias')
    .select('id, nome, plano, trial_termina_em, criado_em')
    .eq('plano', 'trial')
    .order('trial_termina_em', { ascending: true })

  // Fetch suspended barbearias
  const { data: suspData } = await supabase
    .from('barbearias')
    .select('id, nome, plano, trial_termina_em, criado_em')
    .eq('plano', 'suspenso')
    .order('criado_em', { ascending: false })

  const allTrials = (trialData as unknown as Barbearia[]) ?? []
  const suspensos = (suspData as unknown as Barbearia[]) ?? []

  const now = new Date()

  // Split trials into expiring soon vs already expired
  const trialsAtivos = allTrials.filter(
    (b) => b.trial_termina_em && new Date(b.trial_termina_em) > now
  )
  const trialsExpirados = allTrials.filter(
    (b) => !b.trial_termina_em || new Date(b.trial_termina_em) <= now
  )

  // Count how many trials expire in the next 7 days
  const urgentCount = trialsAtivos.filter((b) => {
    if (!b.trial_termina_em) return false
    const diff = (new Date(b.trial_termina_em).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Renovações</h1>
        <p className="text-gray-500 text-sm mt-1">Gestão de trials e renovações de plano</p>
      </div>

      {/* Alert for urgent trials */}
      {urgentCount > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border bg-yellow-50 border-yellow-200 text-yellow-800">
          <span className="text-lg mt-0.5">⚠️</span>
          <p className="text-sm">
            <strong>{urgentCount} trial{urgentCount !== 1 ? 's' : ''}</strong> expiram nos próximos 7 dias.
            Considera contactar estes clientes para converter para plano pago.
          </p>
        </div>
      )}

      {trialError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border bg-red-50 border-red-200 text-red-700">
          <p className="text-sm">Erro ao carregar dados: {trialError.message}</p>
        </div>
      )}

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center min-w-[100px] shadow-sm">
          <p className="text-2xl font-bold text-yellow-600">{trialsAtivos.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Trials ativos</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center min-w-[100px] shadow-sm">
          <p className="text-2xl font-bold text-red-500">{trialsExpirados.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Trials expirados</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center min-w-[100px] shadow-sm">
          <p className="text-2xl font-bold text-gray-500">{suspensos.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Suspensos</p>
        </div>
      </div>

      {/* Trials expiring soon */}
      <SectionTable
        title="Trials a expirar em breve"
        description="Ordenados pelo que expira mais cedo"
        barbearias={trialsAtivos}
        expired={false}
        emptyMessage="Nenhum trial ativo de momento."
        accentColor="bg-yellow-400"
      />

      {/* Expired trials */}
      <SectionTable
        title="Trials expirados"
        description="Clientes em trial que já expiraram"
        barbearias={trialsExpirados}
        expired={true}
        emptyMessage="Nenhum trial expirado."
        accentColor="bg-red-400"
      />

      {/* Suspended */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <div>
            <h2 className="text-base font-semibold text-gray-900">Barbearias Suspensas</h2>
            <p className="text-xs text-gray-400 mt-0.5">Contas com plano suspenso</p>
          </div>
          <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            {suspensos.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Registo
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {suspensos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-400 text-sm">
                    Nenhuma conta suspensa.
                  </td>
                </tr>
              ) : (
                suspensos.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-900">{b.nome}</td>
                    <td className="px-6 py-3.5 text-gray-500">{formatDate(b.criado_em)}</td>
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/admin/clientes/${b.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0e4324] bg-[#0e4324]/10 hover:bg-[#0e4324]/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Gerir cliente →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
