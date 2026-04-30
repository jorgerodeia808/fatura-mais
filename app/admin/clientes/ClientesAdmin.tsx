'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ClienteUnificado } from './page'

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

const todosOsNichos = ['barbeiro', 'nails', 'lash', 'tatuador', 'fp']

export default function ClientesAdmin({ clientes }: { clientes: ClienteUnificado[] }) {
  const [search, setSearch] = useState('')
  const [nichoFiltro, setNichoFiltro] = useState<string | null>(null)

  const filtrados = clientes.filter(c => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchNicho = !nichoFiltro || c.nicho === nichoFiltro
    return matchSearch && matchNicho
  })

  return (
    <div className="space-y-6">
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
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Total pago</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Registado em</th>
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
                filtrados.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-ink">{c.nome}</p>
                      {c.notas && <p className="text-xs text-ink-secondary mt-0.5 truncate max-w-[160px]">{c.notas}</p>}
                    </td>
                    <td className="px-6 py-3.5 text-ink-secondary text-xs">{c.email}</td>
                    <td className="px-6 py-3.5"><NichoBadge nicho={c.nicho} /></td>
                    <td className="px-6 py-3.5"><PlanoBadge plano={c.plano} /></td>
                    <td className="px-6 py-3.5 text-right">
                      {c.valor_pago_total != null ? (
                        <span className="font-semibold text-verde">
                          {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(c.valor_pago_total)}
                        </span>
                      ) : (
                        <span className="text-ink-secondary/30">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-ink-secondary">{formatDate(c.criado_em)}</td>
                    <td className="px-6 py-3.5">
                      {c.nicho !== 'fp' && (
                        <Link
                          href={`/admin/clientes/${c.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-verde hover:text-verde/80 bg-verde/5 hover:bg-verde/10 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Ver detalhes
                          <span className="material-symbols-outlined text-[13px] leading-none" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>chevron_right</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
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
