import { createAdminClient } from '@/lib/supabase/admin'

interface PagamentoRaw {
  id: string
  created_at: string
  valor: number | null
  metodo: string | null
  notas: string | null
  tipo: string | null
  barbearias: { nome: string } | null
}

function TipoBadge({ tipo }: { tipo: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    mensal: { label: 'Mensal', cls: 'badge badge-green' },
    vitalicio: { label: 'Vitalício', cls: 'badge badge-gold' },
    trial_ext: { label: 'Extensão Trial', cls: 'badge badge-amber' },
  }
  const key = tipo ?? ''
  const style = map[key] ?? { label: tipo ?? 'Outro', cls: 'badge badge-gray' }
  return <span className={style.cls}>{style.label}</span>
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCurrency(value: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)
}

export default async function PagamentosPage() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('pagamentos_recebidos')
    .select('*, barbearias(nome)')
    .order('created_at', { ascending: false })

  const pagamentos = (data as unknown as PagamentoRaw[]) ?? []

  const totalRecebido = pagamentos.reduce((sum, p) => sum + (p.valor ?? 0), 0)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const esteMes = pagamentos
    .filter((p) => p.created_at && new Date(p.created_at) >= startOfMonth)
    .reduce((sum, p) => sum + (p.valor ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Pagamentos</h1>
        <p className="text-sm text-ink-secondary mt-1">Histórico de pagamentos recebidos</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="metric-label mb-2">Total recebido</p>
          <p className="font-serif font-bold text-3xl text-verde">{formatCurrency(totalRecebido)}</p>
          <p className="text-xs text-ink-secondary mt-1">todos os tempos</p>
        </div>
        <div className="metric-card">
          <p className="metric-label mb-2">Este mês</p>
          <p className="font-serif font-bold text-3xl text-dourado">{formatCurrency(esteMes)}</p>
          <p className="text-xs text-ink-secondary mt-1">
            {now.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="metric-card">
          <p className="metric-label mb-2">N.º de pagamentos</p>
          <p className="metric-value">{pagamentos.length}</p>
          <p className="text-xs text-ink-secondary mt-1">registos no total</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-[#e8e4dc]">
          <h2 className="section-title">Todos os pagamentos</h2>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-100 text-red-700 text-sm">
            Erro ao carregar dados: {error.message}
          </div>
        )}

        {pagamentos.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
              <span
                className="material-symbols-outlined text-[32px] text-ink-secondary/50 leading-none"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 40" }}
              >
                payments
              </span>
            </div>
            <h3 className="font-serif font-bold text-base text-ink mb-1">Sem pagamentos registados</h3>
            <p className="text-sm text-ink-secondary max-w-sm">
              Quando forem registados pagamentos na tabela{' '}
              <code className="bg-surface px-1 rounded text-xs">pagamentos_recebidos</code>, aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f7f4ee] border-b border-[#e8e4dc]">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                    Data
                  </th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                    Método
                  </th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece4]">
                {pagamentos.map((p) => (
                  <tr key={p.id} className="table-row-hover transition-colors">
                    <td className="px-6 py-3.5 text-ink-secondary whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-ink">
                      {p.barbearias?.nome ?? (
                        <span className="text-ink-secondary italic">Desconhecido</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-verde whitespace-nowrap">
                      {formatCurrency(p.valor)}
                    </td>
                    <td className="px-6 py-3.5 text-ink-secondary">
                      {p.metodo ? (
                        <span className="capitalize">{p.metodo}</span>
                      ) : (
                        <span className="text-ink-secondary/30">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <TipoBadge tipo={p.tipo} />
                    </td>
                    <td className="px-6 py-3.5 text-ink-secondary max-w-xs truncate">
                      {p.notas ?? <span className="text-ink-secondary/30">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagamentos.length > 0 && (
          <div className="px-6 py-3 bg-[#f7f4ee] border-t border-[#e8e4dc] text-xs text-ink-secondary">
            {pagamentos.length} pagamento{pagamentos.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
