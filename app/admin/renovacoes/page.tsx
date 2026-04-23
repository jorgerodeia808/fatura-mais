import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

interface Barbearia {
  id: string
  nome: string
  plano: string | null
  criado_em: string
  subscricao_renovacao?: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default async function RenovacoesPage() {
  const supabase = createAdminClient()

  const { data: mensaisData } = await supabase
    .from('barbearias')
    .select('id, nome, plano, criado_em, subscricao_renovacao')
    .eq('plano', 'mensal')
    .order('subscricao_renovacao', { ascending: true })

  const { data: suspData } = await supabase
    .from('barbearias')
    .select('id, nome, plano, criado_em')
    .eq('plano', 'suspenso')
    .order('criado_em', { ascending: false })

  const mensais = (mensaisData as unknown as Barbearia[]) ?? []
  const suspensos = (suspData as unknown as Barbearia[]) ?? []

  const now = new Date()

  const mensaisUrgentes = mensais.filter(b => {
    if (!b.subscricao_renovacao) return false
    const dias = (new Date(b.subscricao_renovacao).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return dias <= 5
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Renovações</h1>
        <p className="text-gray-500 text-sm mt-1">Gestão de subscrições mensais</p>
      </div>

      {/* Alert for urgent renewals */}
      {mensaisUrgentes.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border bg-yellow-50 border-yellow-200 text-yellow-800">
          <span className="text-lg mt-0.5">⚠️</span>
          <p className="text-sm">
            <strong>{mensaisUrgentes.length} subscrição{mensaisUrgentes.length !== 1 ? 'ões' : ''}</strong> renovam nos próximos 5 dias.
            Contacta estes clientes para confirmar pagamento.
          </p>
        </div>
      )}

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center min-w-[100px] shadow-sm">
          <p className="text-2xl font-bold text-green-600">{mensais.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Mensais ativos</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center min-w-[100px] shadow-sm">
          <p className="text-2xl font-bold text-gray-500">{suspensos.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Suspensos</p>
        </div>
      </div>

      {/* Mensais */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <div>
            <h2 className="text-base font-semibold text-gray-900">Subscrições mensais</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ordenados pela data de renovação mais próxima</p>
          </div>
          <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{mensais.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Renova em</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mensais.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400 text-sm">Sem clientes em plano mensal.</td></tr>
              ) : mensais.map(b => {
                const dias = b.subscricao_renovacao
                  ? Math.ceil((new Date(b.subscricao_renovacao).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : null
                const urgente = dias !== null && dias <= 5
                return (
                  <tr key={b.id} className={`hover:bg-gray-50/50 transition-colors ${urgente ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-6 py-3.5 font-medium text-gray-900">{b.nome}</td>
                    <td className="px-6 py-3.5">
                      {b.subscricao_renovacao ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-gray-700">{formatDate(b.subscricao_renovacao)}</span>
                          <span className={`text-xs font-medium ${dias !== null && dias <= 0 ? 'text-red-600' : urgente ? 'text-amber-600' : 'text-gray-400'}`}>
                            {dias !== null && dias >= 0 ? `(${dias}d)` : dias !== null ? `(expirou há ${Math.abs(dias)}d)` : ''}
                          </span>
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-3.5">
                      <Link href={`/admin/clientes/${b.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0e4324] bg-[#0e4324]/10 hover:bg-[#0e4324]/20 px-3 py-1.5 rounded-lg transition-colors">
                        Gerir →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

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
