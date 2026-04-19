import { createAdminClient } from '@/lib/supabase/admin'
import ConvidarButton from './ConvidarButton'

interface Pedido {
  id: string
  nome_barbearia: string
  email: string
  instagram: string | null
  estado: string
  criado_em: string
  convidado_em: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SectionTable({
  title,
  accentColor,
  count,
  children,
}: {
  title: string
  accentColor: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${accentColor}`} />
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {count}
        </span>
      </div>
      {children}
    </div>
  )
}

export default async function PedidosPage() {
  const supabase = createAdminClient()

  const { data: pedidos } = await supabase
    .from('pedidos_acesso')
    .select('*')
    .order('criado_em', { ascending: false })

  const pendentes = (pedidos ?? []).filter((p: Pedido) => p.estado === 'pendente')
  const convidados = (pedidos ?? []).filter((p: Pedido) => p.estado === 'convidado')

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif font-bold text-2xl text-gray-900">Pedidos de acesso</h1>
        <p className="text-sm text-gray-500 mt-1">Gere quem pode aceder ao Fatura+</p>
      </div>

      <SectionTable title="Pendentes" accentColor="bg-amber-400" count={pendentes.length}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Barbearia</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Instagram</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendentes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400 italic">
                    Sem pedidos pendentes
                  </td>
                </tr>
              ) : (
                pendentes.map((p: Pedido) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.nome_barbearia}</td>
                    <td className="px-6 py-4 text-gray-600">{p.email}</td>
                    <td className="px-6 py-4 text-gray-400">{p.instagram ? `@${p.instagram}` : '—'}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(p.criado_em)}</td>
                    <td className="px-6 py-4 text-right">
                      <ConvidarButton pedidoId={p.id} email={p.email} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionTable>

      <SectionTable title="Convidados" accentColor="bg-green-500" count={convidados.length}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Barbearia</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Instagram</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Convidado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {convidados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400 italic">
                    Nenhum convite enviado ainda
                  </td>
                </tr>
              ) : (
                convidados.map((p: Pedido) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.nome_barbearia}</td>
                    <td className="px-6 py-4 text-gray-600">{p.email}</td>
                    <td className="px-6 py-4 text-gray-400">{p.instagram ? `@${p.instagram}` : '—'}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {p.convidado_em ? formatDate(p.convidado_em) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionTable>
    </div>
  )
}
