import { createClient } from '@/lib/supabase/server'

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
    mensal: { label: 'Mensal', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
    vitalicio: { label: 'Vitalício', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
    trial_ext: { label: 'Extensão Trial', cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  }
  const key = tipo ?? ''
  const style = map[key] ?? { label: tipo ?? 'Outro', cls: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style.cls}`}>
      {style.label}
    </span>
  )
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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pagamentos_recebidos')
    .select('*, barbearias(nome)')
    .order('created_at', { ascending: false })

  const pagamentos = (data as unknown as PagamentoRaw[]) ?? []

  // Summary calculations
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
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-gray-500 text-sm mt-1">Histórico de pagamentos recebidos</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total recebido</p>
          <p className="text-3xl font-bold text-[#0e4324]">{formatCurrency(totalRecebido)}</p>
          <p className="text-xs text-gray-400 mt-1">todos os tempos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Este mês</p>
          <p className="text-3xl font-bold text-[#977c30]">{formatCurrency(esteMes)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {now.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nº de pagamentos</p>
          <p className="text-3xl font-bold text-gray-700">{pagamentos.length}</p>
          <p className="text-xs text-gray-400 mt-1">registos no total</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Todos os pagamentos</h2>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-100 text-red-700 text-sm">
            Erro ao carregar dados: {error.message}
          </div>
        )}

        {pagamentos.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">💳</span>
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">Sem pagamentos registados</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              Quando forem registados pagamentos na tabela{' '}
              <code className="bg-gray-100 px-1 rounded text-xs">pagamentos_recebidos</code>, aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagamentos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-gray-900">
                      {p.barbearias?.nome ?? (
                        <span className="text-gray-400 italic">Desconhecido</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-[#0e4324] whitespace-nowrap">
                      {formatCurrency(p.valor)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">
                      {p.metodo ? (
                        <span className="capitalize">{p.metodo}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <TipoBadge tipo={p.tipo} />
                    </td>
                    <td className="px-6 py-3.5 text-gray-400 max-w-xs truncate">
                      {p.notas ?? <span className="text-gray-200">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagamentos.length > 0 && (
          <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400">
            {pagamentos.length} pagamento{pagamentos.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
