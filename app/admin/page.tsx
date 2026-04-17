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
    trial: { label: 'Trial', cls: 'badge badge-amber' },
    mensal: { label: 'Mensal', cls: 'badge badge-green' },
    vitalicio: { label: 'Vitalício', cls: 'badge badge-gold' },
    suspenso: { label: 'Suspenso', cls: 'badge badge-red' },
  }
  const p = plano ?? 'desconhecido'
  const style = map[p] ?? { label: p, cls: 'badge badge-gray' }
  return <span className={style.cls}>{style.label}</span>
}

function MetricCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string
  value: number
  icon: string
  sub?: string
}) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between mb-3">
        <span
          className="material-symbols-outlined text-[22px] text-ink-secondary leading-none"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
        >
          {icon}
        </span>
        {sub && (
          <span className="badge badge-gray text-[10px]">{sub}</span>
        )}
      </div>
      <p className="metric-value">{value}</p>
      <p className="metric-label mt-1">{label}</p>
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
        <h1 className="page-title">Visão Geral</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Painel de administração Fatura+{' '}
          <span className="text-ink-secondary/60">·</span>{' '}
          {new Date().toLocaleDateString('pt-PT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Barbearias"
          value={total}
          icon="store"
          sub="total"
        />
        <MetricCard
          label="Em Trial"
          value={emTrial}
          icon="hourglass_empty"
          sub="ativo"
        />
        <MetricCard
          label="Assinantes Ativos"
          value={assinantes}
          icon="check_circle"
          sub="mensal + vitalício"
        />
        <MetricCard
          label="Suspensos"
          value={suspensos}
          icon="cancel"
        />
      </div>

      {/* Recent Signups Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-[#e8e4dc]">
          <h2 className="section-title">Registos Recentes</h2>
          <p className="text-xs text-ink-secondary mt-0.5">Últimas 10 barbearias registadas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e4dc] bg-[#f7f4ee]">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                  Plano
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                  Registo
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                  Trial termina
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ece4]">
              {recentSignups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-ink-secondary text-sm">
                    Nenhuma barbearia registada ainda.
                  </td>
                </tr>
              ) : (
                recentSignups.map((b) => (
                  <tr key={b.id} className="table-row-hover transition-colors">
                    <td className="px-6 py-3.5 font-medium text-ink">{b.nome}</td>
                    <td className="px-6 py-3.5">
                      <PlanoBadge plano={b.plano} />
                    </td>
                    <td className="px-6 py-3.5 text-ink-secondary">{formatDate(b.created_at)}</td>
                    <td className="px-6 py-3.5">
                      {b.plano === 'trial' ? (
                        <span
                          className={
                            b.trial_termina_em && new Date(b.trial_termina_em) > now
                              ? 'text-[#977c30] text-sm'
                              : 'text-red-600 text-sm'
                          }
                        >
                          {trialLabel(b.trial_termina_em, b.plano)}
                        </span>
                      ) : (
                        <span className="text-ink-secondary/30">—</span>
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
