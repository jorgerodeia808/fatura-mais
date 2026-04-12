import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Barbearia {
  id: string
  nome: string
  plano: string | null
  trial_termina_em: string | null
  created_at: string
  valor_pago_total: number | null
  metodo_pagamento: string | null
  indicado_por: string | null
  notas: string | null
}

function PlanoBadge({ plano }: { plano: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    trial: { label: 'Trial', cls: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
    mensal: { label: 'Mensal', cls: 'bg-blue-100 text-blue-800 border border-blue-200' },
    vitalicio: { label: 'Vitalício', cls: 'bg-green-100 text-green-800 border border-green-200' },
    suspenso: { label: 'Suspenso', cls: 'bg-red-100 text-red-800 border border-red-200' },
  }
  const key = plano ?? ''
  const style = map[key] ?? { label: plano ?? 'Desconhecido', cls: 'bg-gray-100 text-gray-600 border border-gray-200' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.cls}`}>
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

function formatTrialDate(iso: string | null, plano: string | null) {
  if (plano !== 'trial') return <span className="text-gray-300">—</span>
  if (!iso) return <span className="text-gray-400">Sem data</span>
  const now = new Date()
  const d = new Date(iso)
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const dateStr = new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  if (diff > 0) {
    return <span className="text-yellow-600">{dateStr} <span className="text-xs">({diff}d)</span></span>
  }
  return <span className="text-red-500">{dateStr} <span className="text-xs">(exp.)</span></span>
}

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('barbearias')
    .select('id, nome, plano, trial_termina_em, created_at, valor_pago_total, metodo_pagamento, indicado_por, notas')
    .order('created_at', { ascending: false })

  const barbearias = (data as unknown as Barbearia[]) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {barbearias.length} barbearia{barbearias.length !== 1 ? 's' : ''} registada{barbearias.length !== 1 ? 's' : ''}
            {' '}
            <span className="text-gray-400 text-xs">· filtro no cliente (client-side)</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pesquisa ainda não implementada
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {['trial', 'mensal', 'vitalicio', 'suspenso'].map((plano) => {
          const count = barbearias.filter((b) => b.plano === plano).length
          const colors: Record<string, string> = {
            trial: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            mensal: 'bg-blue-50 text-blue-700 border-blue-200',
            vitalicio: 'bg-green-50 text-green-700 border-green-200',
            suspenso: 'bg-red-50 text-red-700 border-red-200',
          }
          return (
            <span
              key={plano}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colors[plano]}`}
            >
              <span className="font-bold">{count}</span>
              {plano.charAt(0).toUpperCase() + plano.slice(1)}
            </span>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-100 text-red-700 text-sm">
            Erro ao carregar dados: {error.message}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Plano
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Trial termina
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Total pago (€)
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Registado em
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {barbearias.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🏪</span>
                      <p className="text-gray-400 text-sm">Nenhuma barbearia registada.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                barbearias.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-3.5">
                      <div>
                        <p className="font-medium text-gray-900">{b.nome}</p>
                        {b.indicado_por && (
                          <p className="text-xs text-gray-400 mt-0.5">Ref: {b.indicado_por}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <PlanoBadge plano={b.plano} />
                    </td>
                    <td className="px-6 py-3.5">
                      {formatTrialDate(b.trial_termina_em, b.plano)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {b.valor_pago_total != null ? (
                        <span className="font-semibold text-[#0e4324]">
                          {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(b.valor_pago_total)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">{formatDate(b.created_at)}</td>
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/admin/clientes/${b.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0e4324] hover:text-[#0a3019] bg-[#0e4324]/5 hover:bg-[#0e4324]/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Ver detalhes
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {barbearias.length > 0 && (
          <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400">
            {barbearias.length} resultado{barbearias.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
