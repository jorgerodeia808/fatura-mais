'use client'

import Link from 'next/link'
import { useState, Fragment } from 'react'
import type { ClienteUnificado } from './types'

const nichoLabel: Record<string, string> = {
  barbeiro: 'Barbearia',
  nails: 'Unhas',
  lash: 'Pestanas',
  tatuador: 'Tatuagem',
  fp: 'Finanças Pessoais',
}

const nichoBg: Record<string, string> = {
  barbeiro: '#2d2d2d',
  nails: '#e8779a',
  lash: '#4a148c',
  tatuador: '#111111',
  fp: '#1e3a5f',
}

const planoPillColors: Record<string, string> = {
  mensal: 'bg-[#0e4324]/10 text-[#0e4324] border border-[#0e4324]/20',
  vitalicio: 'bg-[#977c30]/15 text-[#7a6228] border border-[#977c30]/30',
  trial: 'bg-blue-50 text-blue-700 border border-blue-200',
  suspenso: 'bg-red-50 text-red-700 border border-red-200',
}

const PLANOS = ['mensal', 'vitalicio', 'suspenso']

function NichoBadge({ nicho }: { nicho: string }) {
  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full text-white"
      style={{ backgroundColor: nichoBg[nicho] ?? '#717971' }}
    >
      {nichoLabel[nicho] ?? nicho}
    </span>
  )
}

function PlanoBadge({ plano }: { plano: string | null }) {
  const cls = planoPillColors[plano ?? ''] ?? 'bg-gray-100 text-gray-600 border border-gray-200'
  const label = plano ? plano.charAt(0).toUpperCase() + plano.slice(1) : '—'
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{label}</span>
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function diasRestantes(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const todosOsNichos = ['barbeiro', 'nails', 'lash', 'tatuador', 'fp']

export default function ClientesAdmin({ clientes }: { clientes: ClienteUnificado[] }) {
  const [search, setSearch] = useState('')
  const [nichoFiltro, setNichoFiltro] = useState<string | null>(null)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedPlano, setExpandedPlano] = useState('suspenso')
  const [expandedMetodo, setExpandedMetodo] = useState('transferencia')
  const [savingAction, setSavingAction] = useState<'plano' | 'renovar' | null>(null)

  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 3500)
  }

  const handleExpand = (c: ClienteUnificado) => {
    if (expandedId === c.id) { setExpandedId(null); return }
    const plano = c.plano && PLANOS.includes(c.plano) ? c.plano : 'suspenso'
    setExpandedPlano(plano)
    setExpandedMetodo('transferencia')
    setExpandedId(c.id)
  }

  const handleSavePlano = async (c: ClienteUnificado) => {
    setSavingAction('plano')
    const body = c.nicho === 'fp'
      ? { fp_perfil_id: c.id, plano: expandedPlano }
      : { barbearia_id: c.id, plano: expandedPlano }
    const res = await fetch('/api/admin/alterar-plano', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSavingAction(null)
    if (res.ok) {
      showToast('Plano guardado ✓')
      setExpandedId(null)
      window.location.reload()
    } else {
      const data = await res.json()
      showToast(data.error ?? 'Erro ao guardar', 'error')
    }
  }

  const handleRenovar = async (c: ClienteUnificado) => {
    setSavingAction('renovar')
    const body = c.nicho === 'fp'
      ? { fp_perfil_id: c.id, metodo: expandedMetodo }
      : { barbearia_id: c.id, metodo: expandedMetodo }
    const res = await fetch('/api/admin/renovar-subscricao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSavingAction(null)
    if (res.ok) {
      const data = await res.json()
      const nova = new Date(data.nova_renovacao).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      showToast(`Subscrição renovada até ${nova} ✓`)
      setExpandedId(null)
      window.location.reload()
    } else {
      const data = await res.json()
      showToast(data.error ?? 'Erro ao renovar', 'error')
    }
  }

  const filtrados = clientes.filter(c => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchNicho = !nichoFiltro || c.nicho === nichoFiltro
    return matchSearch && matchNicho
  })

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 text-white ${toastType === 'error' ? 'bg-red-600' : 'bg-[#0e4324]'}`}>
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="text-sm text-ink-secondary mt-1">
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registado{clientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-ink-secondary/50 text-[16px]">search</span>
          <input
            type="text"
            placeholder="Pesquisar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-[#e8e4dc] rounded-lg bg-white focus:outline-none focus:border-[#0e4324] transition-colors w-64"
          />
        </div>
      </div>

      {/* Filtro de nicho */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setNichoFiltro(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            !nichoFiltro ? 'bg-[#0e4324] text-white border-[#0e4324]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          Todos ({clientes.length})
        </button>
        {todosOsNichos.map(n => {
          const count = clientes.filter(c => c.nicho === n).length
          if (count === 0) return null
          return (
            <button
              key={n}
              onClick={() => setNichoFiltro(nichoFiltro === n ? null : n)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                nichoFiltro === n ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
              style={nichoFiltro === n ? { backgroundColor: nichoBg[n] } : {}}
            >
              {nichoLabel[n]} ({count})
            </button>
          )
        })}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f4ee] border-b border-[#e8e4dc]">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Nicho</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Plano</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Renovação</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Total pago</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ece4]">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <p className="text-ink-secondary text-sm">{search ? 'Nenhum resultado para a pesquisa.' : 'Nenhum cliente registado.'}</p>
                  </td>
                </tr>
              ) : (
                filtrados.map(c => {
                  const isExpanded = expandedId === c.id
                  const dias = c.subscricao_renovacao ? diasRestantes(c.subscricao_renovacao) : null

                  return (
                    <Fragment key={c.id}>
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-ink">{c.nome}</p>
                          {c.notas && <p className="text-xs text-ink-secondary mt-0.5 truncate max-w-[160px]">{c.notas}</p>}
                        </td>
                        <td className="px-6 py-3.5 text-ink-secondary text-xs">{c.email}</td>
                        <td className="px-6 py-3.5"><NichoBadge nicho={c.nicho} /></td>
                        <td className="px-6 py-3.5"><PlanoBadge plano={c.plano} /></td>
                        <td className="px-6 py-3.5">
                          {c.subscricao_renovacao ? (
                            <div>
                              <p className={`text-xs font-medium ${dias !== null && dias <= 5 ? 'text-amber-700' : 'text-ink'}`}>
                                {formatDate(c.subscricao_renovacao)}
                              </p>
                              {dias !== null && (
                                <p className={`text-[11px] ${dias <= 0 ? 'text-red-600' : dias <= 5 ? 'text-amber-600' : 'text-ink-secondary'}`}>
                                  {dias <= 0 ? `Expirou há ${Math.abs(dias)}d` : `${dias} dias`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-ink-secondary/30 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {c.valor_pago_total != null ? (
                            <span className="font-semibold text-verde">
                              {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(c.valor_pago_total)}
                            </span>
                          ) : (
                            <span className="text-ink-secondary/30">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={() => handleExpand(c)}
                              className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                isExpanded
                                  ? 'bg-[#0e4324] text-white'
                                  : 'text-verde hover:text-verde/80 bg-verde/5 hover:bg-verde/10'
                              }`}
                            >
                              Gerir plano
                              <span className="material-symbols-outlined text-[13px] leading-none" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>
                            {c.nicho !== 'fp' && (
                              <Link
                                href={`/admin/clientes/${c.id}`}
                                className="text-[11px] text-ink-secondary/60 hover:text-ink-secondary transition-colors"
                              >
                                Ver detalhes →
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#f7f4ee]">
                          <td colSpan={7} className="px-6 py-4 border-t border-[#e8e4dc]">
                            <div className="space-y-3">

                              {/* Plan selector */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-ink-secondary min-w-[56px]">Plano:</span>
                                {PLANOS.map(p => (
                                  <button
                                    key={p}
                                    onClick={() => setExpandedPlano(p)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                      expandedPlano === p
                                        ? 'bg-[#0e4324] text-white border-[#0e4324]'
                                        : 'bg-white text-ink border-[#e8e4dc] hover:border-[#0e4324]/30'
                                    }`}
                                  >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                  </button>
                                ))}
                                <button
                                  onClick={() => handleSavePlano(c)}
                                  disabled={savingAction === 'plano'}
                                  className="ml-auto text-xs font-semibold px-4 py-1.5 rounded-lg bg-[#0e4324] text-white hover:bg-[#0e4324]/90 disabled:opacity-50 transition-colors"
                                >
                                  {savingAction === 'plano' ? 'A guardar...' : 'Guardar plano'}
                                </button>
                                <button
                                  onClick={() => setExpandedId(null)}
                                  className="text-ink-secondary hover:text-ink transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                              </div>

                              {/* Quick renewal */}
                              <div className="flex flex-wrap items-center gap-2 border-t border-[#e8e4dc] pt-3">
                                <span className="text-xs font-semibold text-ink-secondary min-w-[56px]">Renovar:</span>
                                {c.subscricao_renovacao && (
                                  <span className="text-xs text-ink-secondary">
                                    Atual: <strong>{formatDate(c.subscricao_renovacao)}</strong>
                                    {dias !== null && (dias <= 0
                                      ? <span className="text-red-600"> (expirou há {Math.abs(dias)}d)</span>
                                      : <span className={dias <= 5 ? 'text-amber-600' : ''}> ({dias}d)</span>
                                    )}
                                  </span>
                                )}
                                <select
                                  value={expandedMetodo}
                                  onChange={e => setExpandedMetodo(e.target.value)}
                                  className="border border-[#e8e4dc] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#0e4324] bg-white transition-colors"
                                >
                                  <option value="transferencia">Transferência</option>
                                  <option value="multibanco">Multibanco</option>
                                  <option value="mbway">MBWay</option>
                                  <option value="numerario">Numerário</option>
                                </select>
                                <button
                                  onClick={() => handleRenovar(c)}
                                  disabled={savingAction === 'renovar'}
                                  className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-[#977c30] text-white hover:bg-[#7a6228] disabled:opacity-50 transition-colors"
                                >
                                  {savingAction === 'renovar' ? 'A renovar...' : 'Renovar +30 dias (€12,99)'}
                                </button>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {filtrados.length > 0 && (
          <div className="px-6 py-3 bg-[#f7f4ee] border-t border-[#e8e4dc] text-xs text-ink-secondary">
            {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}{search || nichoFiltro ? ' filtrados' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
