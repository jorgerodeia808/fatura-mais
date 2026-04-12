import { createClient } from '@/lib/supabase/server'

interface Barbearia {
  id: string
  nome: string
  plano: string | null
  trial_termina_em: string | null
  created_at: string
  user_id: string
}

function PlanoBadge({ plano }: { plano: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    trial: { label: 'Trial', cls: 'bg-yellow-100 text-yellow-800' },
    mensal: { label: 'Mensal', cls: 'bg-blue-100 text-blue-800' },
    vitalicio: { label: 'Vitalício', cls: 'bg-green-100 text-green-800' },
    suspenso: { label: 'Suspenso', cls: 'bg-red-100 text-red-800' },
  }
  const p = plano ?? 'desconhecido'
  const style = map[p] ?? { label: p, cls: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.cls}`}>
      {style.label}
    </span>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string
  value: number
  icon: string
  color: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {sub && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{sub}</span>
        )}
      </div>
      <p className="text-3xl font-bold text-[#0e4324]">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: barbearias } = await supabase
    .from('barbearias')
    .select('id, nome, plano, trial_termina_em, created_at, user_id')
    .order('created_at', { ascending: false })

  const list = (barbearias as unknown as Barbearia[]) ?? []

  const now = new Date()

  const total = list.length
  const emTrial = list.filter(
    (b) =>
      b.plano === 'trial' &&
      b.trial_termina_em &&
      new Date(b.trial_termina_em) > now
  ).length
  const assinantes = list.filter(
    (b) => b.plano === 'mensal' || b.plano === 'vitalicio'
  ).length
  const suspensos = list.filter((b) => b.plano === 'suspenso').length

  const recentSignups = list.slice(0, 10)

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function trialLabel(iso: string | null, plano: string | null) {
    if (plano !== 'trial') return '—'
    if (!iso) return 'Sem data'
    const d = new Date(iso)
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff > 0) return `em ${diff} dias`
    return `expirou há ${Math.abs(diff)} dias`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-500 text-sm mt-1">
          Painel de administração Fatura+ ·{' '}
          {new Date().toLocaleDateString('pt-PT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Barbearias"
          value={total}
          icon="🏪"
          color="bg-gray-100 text-gray-600"
          sub="total"
        />
        <StatCard
          label="Em Trial"
          value={emTrial}
          icon="⏳"
          color="bg-yellow-100 text-yellow-700"
          sub="activo"
        />
        <StatCard
          label="Assinantes Ativos"
          value={assinantes}
          icon="✅"
          color="bg-green-100 text-green-700"
          sub="mensal + vitalício"
        />
        <StatCard
          label="Suspensos"
          value={suspensos}
          icon="🚫"
          color="bg-red-100 text-red-700"
        />
      </div>

      {/* Recent Signups Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Registos Recentes</h2>
          <p className="text-xs text-gray-400 mt-0.5">Últimas 10 barbearias registadas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Plano
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Registo
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Trial termina
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSignups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Nenhuma barbearia registada ainda.
                  </td>
                </tr>
              ) : (
                recentSignups.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-900">{b.nome}</td>
                    <td className="px-6 py-3.5">
                      <PlanoBadge plano={b.plano} />
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">{formatDate(b.created_at)}</td>
                    <td className="px-6 py-3.5 text-gray-500">
                      {b.plano === 'trial' ? (
                        <span
                          className={
                            b.trial_termina_em && new Date(b.trial_termina_em) > now
                              ? 'text-yellow-600'
                              : 'text-red-500'
                          }
                        >
                          {trialLabel(b.trial_termina_em, b.plano)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
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
