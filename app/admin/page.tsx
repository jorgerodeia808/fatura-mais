export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

interface Barbearia {
  id: string
  nome: string
  plano: string | null
  nicho: string | null
  criado_em: string
}

interface Pedido {
  id: string
  estado: string | null
}

function MetricCard({ label, value, icon, sub, href }: {
  label: string; value: number; icon: string; sub?: string; href?: string
}) {
  const inner = (
    <div className="metric-card h-full">
      <div className="flex items-start justify-between mb-3">
        <span className="material-symbols-outlined text-[22px] text-ink-secondary leading-none"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
          {icon}
        </span>
        {sub && <span className="badge badge-gray text-[10px]">{sub}</span>}
      </div>
      <p className="metric-value">{value}</p>
      <p className="metric-label mt-1">{label}</p>
    </div>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : <div>{inner}</div>
}

const nichoConfig: Record<string, { label: string; cor: string; letra: string }> = {
  barbeiro: { label: 'Barber+',  cor: '#2d2d2d', letra: 'B' },
  nails:    { label: 'Nails+',   cor: '#e8779a', letra: 'N' },
  lash:     { label: 'Lash+',    cor: '#4a148c', letra: 'L' },
  tatuador: { label: 'Tattoo+',  cor: '#111111', letra: 'T' },
  fp:       { label: 'FP+',      cor: '#1e3a5f', letra: 'FP' },
}

export default async function AdminPage() {
  const supabase = createAdminClient()

  const [{ data: barbearias }, { data: fpPerfis }, { data: pedidos }] = await Promise.all([
    supabase.from('barbearias').select('id, nome, plano, nicho, criado_em').order('criado_em', { ascending: false }),
    supabase.from('fp_perfis').select('id, plano, criado_em').order('criado_em', { ascending: false }),
    supabase.from('pedidos_acesso').select('id, estado').order('criado_em', { ascending: false }),
  ])

  const list = (barbearias as unknown as Barbearia[]) ?? []
  const fpList = (fpPerfis ?? []) as { id: string; plano: string | null; criado_em: string }[]
  const pedList = (pedidos as unknown as Pedido[]) ?? []

  const total = list.length + fpList.length
  const assinantes = list.filter((b) => b.plano === 'mensal' || b.plano === 'vitalicio').length
                   + fpList.filter((f) => f.plano === 'mensal' || f.plano === 'vitalicio').length
  const suspensos = list.filter((b) => b.plano === 'suspenso').length
                  + fpList.filter((f) => f.plano === 'suspenso').length
  const pedidosPendentes = pedList.filter((p) => !p.estado || p.estado === 'pendente').length

  // breakdown por nicho (barbearias + fp)
  const porNicho: Record<string, number> = {}
  for (const b of list) {
    const n = b.nicho ?? 'barbeiro'
    porNicho[n] = (porNicho[n] ?? 0) + 1
  }
  if (fpList.length > 0) porNicho['fp'] = fpList.length

  const recentSignups = list.slice(0, 8)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function PlanoBadge({ plano }: { plano: string | null }) {
    const map: Record<string, { label: string; cls: string }> = {
      mensal:   { label: 'Mensal',    cls: 'badge badge-green' },
      vitalicio:{ label: 'Vitalício', cls: 'badge badge-gold' },
      suspenso: { label: 'Suspenso',  cls: 'badge badge-red' },
    }
    const p = plano ?? 'desconhecido'
    const style = map[p] ?? { label: p, cls: 'badge badge-gray' }
    return <span className={style.cls}>{style.label}</span>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="page-title">Visão Geral</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Painel de administração Fatura+{' '}
          <span className="text-ink-secondary/60">·</span>{' '}
          {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Clientes"     value={total}             icon="store"         sub="total" />
        <MetricCard label="Assinantes Ativos"  value={assinantes}        icon="check_circle"  sub="mensal + vitalício" />
        <MetricCard label="Suspensos"          value={suspensos}         icon="cancel" />
        <MetricCard label="Pedidos Pendentes"  value={pedidosPendentes}  icon="mark_email_unread" sub="novo" href="/admin/pedidos" />
      </div>

      {/* Breakdown por nicho */}
      {Object.keys(porNicho).length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">Clientes por plataforma</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(porNicho).map(([nicho, count]) => {
              const cfg = nichoConfig[nicho] ?? { label: nicho, cor: '#717971', letra: '?' }
              return (
                <div key={nicho} className="flex items-center gap-2.5 bg-[#f7f4ee] rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold italic"
                    style={{ backgroundColor: cfg.cor }}>
                    {cfg.letra}+
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{cfg.label}</p>
                    <p className="text-xs text-ink-secondary">{count} cliente{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Signups */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-[#e8e4dc] flex items-center justify-between">
          <div>
            <h2 className="section-title">Registos Recentes</h2>
            <p className="text-xs text-ink-secondary mt-0.5">Últimos 8 clientes registados</p>
          </div>
          <Link href="/admin/clientes" className="text-xs text-ink-secondary hover:text-verde transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e4dc] bg-[#f7f4ee]">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Plataforma</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Plano</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Registo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ece4]">
              {recentSignups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-ink-secondary text-sm">
                    Nenhum cliente registado ainda.
                  </td>
                </tr>
              ) : (
                recentSignups.map((b) => {
                  const cfg = nichoConfig[b.nicho ?? 'barbeiro']
                  return (
                    <tr key={b.id} className="table-row-hover transition-colors">
                      <td className="px-6 py-3.5 font-medium text-ink">
                        <Link href={`/admin/clientes/${b.id}`} className="hover:text-verde transition-colors">
                          {b.nome}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        {cfg ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md text-white"
                            style={{ backgroundColor: cfg.cor }}>
                            {cfg.letra}+ {cfg.label}
                          </span>
                        ) : <span className="text-ink-secondary">—</span>}
                      </td>
                      <td className="px-6 py-3.5"><PlanoBadge plano={b.plano} /></td>
                      <td className="px-6 py-3.5 text-ink-secondary">{formatDate(b.criado_em)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
