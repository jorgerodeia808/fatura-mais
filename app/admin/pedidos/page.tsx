export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import ConvidarButton from './ConvidarButton'
import ConvidarDiretoForm from './ConvidarDiretoForm'
import ReenviarButton from './ReenviarButton'

interface Pedido {
  id: string
  nome: string | null
  nome_barbearia: string | null
  email: string
  telefone: string | null
  nicho: string | null
  estado: string
  criado_em: string
  convidado_em: string | null
}

const nichoLabel: Record<string, string> = {
  barbeiro: 'Barbearia',
  nails: 'Unhas',
  lash: 'Pestanas',
  tatuador: 'Tatuagem',
}

const nichoBg: Record<string, string> = {
  barbeiro: '#2d2d2d',
  nails: '#e8779a',
  lash: '#4a148c',
  tatuador: '#111111',
}

function NichoBadge({ nicho }: { nicho: string | null }) {
  if (!nicho) return <span className="text-gray-300">—</span>
  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full text-white"
      style={{ backgroundColor: nichoBg[nicho] ?? '#717971' }}
    >
      {nichoLabel[nicho] ?? nicho}
    </span>
  )
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-gray-900">Pedidos de acesso</h1>
          <p className="text-sm text-gray-500 mt-1">Gere quem pode aceder ao Fatura+</p>
        </div>
        <ConvidarDiretoForm />
      </div>

      <SectionTable title="Pendentes" accentColor="bg-amber-400" count={pendentes.length}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacto</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Área</th>
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
                    <td className="px-6 py-4 font-medium text-gray-900">{p.nome ?? p.nome_barbearia ?? '—'}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600">{p.email}</div>
                      {p.telefone && <div className="text-xs text-gray-400 mt-0.5">{p.telefone}</div>}
                    </td>
                    <td className="px-6 py-4"><NichoBadge nicho={p.nicho} /></td>
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacto</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Área</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Convidado em</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {convidados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400 italic">
                    Nenhum convite enviado ainda
                  </td>
                </tr>
              ) : (
                convidados.map((p: Pedido) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.nome ?? p.nome_barbearia ?? '—'}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600">{p.email}</div>
                      {p.telefone && <div className="text-xs text-gray-400 mt-0.5">{p.telefone}</div>}
                    </td>
                    <td className="px-6 py-4"><NichoBadge nicho={p.nicho} /></td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {p.convidado_em ? formatDate(p.convidado_em) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ReenviarButton email={p.email} nomeBarbearia={p.nome ?? p.nome_barbearia ?? ''} />
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
