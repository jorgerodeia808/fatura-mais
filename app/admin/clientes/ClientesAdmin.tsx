'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Barbearia {
  id: string
  nome: string
  plano: string | null
  criado_em: string
  valor_pago_total: number | null
  metodo_pagamento: string | null
  indicado_por: string | null
  notas: string | null
}

function PlanoBadge({ plano }: { plano: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    mensal: { label: 'Mensal', cls: 'badge badge-green' },
    vitalicio: { label: 'Vitalício', cls: 'badge badge-gold' },
    suspenso: { label: 'Suspenso', cls: 'badge badge-red' },
  }
  const key = plano ?? ''
  const style = map[key] ?? { label: plano ?? 'Desconhecido', cls: 'badge badge-gray' }
  return <span className={style.cls}>{style.label}</span>
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const planoPillColors: Record<string, string> = {
  mensal: 'bg-[#0e4324]/10 text-[#0e4324] border border-[#0e4324]/20',
  vitalicio: 'bg-[#977c30]/15 text-[#7a6228] border border-[#977c30]/30',
  suspenso: 'bg-red-50 text-red-700 border border-red-200',
}

export default function ClientesAdmin({ barbearias }: { barbearias: Barbearia[] }) {
  const [search, setSearch] = useState('')

  const filtradas = barbearias.filter(b =>
    b.nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="text-sm text-ink-secondary mt-1">
            {barbearias.length} barbearia{barbearias.length !== 1 ? 's' : ''} registada{barbearias.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-ink-secondary/50 text-[16px]">search</span>
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-[#e8e4dc] rounded-lg bg-white focus:outline-none focus:border-[#0e4324] transition-colors w-52"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['mensal', 'vitalicio', 'suspenso'].map((plano) => {
          const count = barbearias.filter((b) => b.plano === plano).length
          return (
            <span
              key={plano}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${planoPillColors[plano] ?? 'bg-gray-100 text-gray-600'}`}
            >
              <span className="font-bold">{count}</span>
              {plano.charAt(0).toUpperCase() + plano.slice(1)}
            </span>
          )
        })}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f4ee] border-b border-[#e8e4dc]">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Plano</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Total pago (€)</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Registado em</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ece4]">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-[40px] text-ink-secondary/40 leading-none" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 40" }}>store</span>
                      <p className="text-ink-secondary text-sm">{search ? 'Nenhum resultado para a pesquisa.' : 'Nenhuma barbearia registada.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtradas.map((b) => (
                  <tr key={b.id} className="table-row-hover transition-colors">
                    <td className="px-6 py-3.5">
                      <div>
                        <p className="font-medium text-ink">{b.nome}</p>
                        {b.notas && <p className="text-xs text-ink-secondary mt-0.5 truncate max-w-[160px]">{b.notas}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-3.5"><PlanoBadge plano={b.plano} /></td>
                    <td className="px-6 py-3.5 text-right">
                      {b.valor_pago_total != null ? (
                        <span className="font-semibold text-verde">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(b.valor_pago_total)}</span>
                      ) : (
                        <span className="text-ink-secondary/30">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-ink-secondary">{formatDate(b.criado_em)}</td>
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/admin/clientes/${b.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-verde hover:text-verde/80 bg-verde/5 hover:bg-verde/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Ver detalhes
                        <span className="material-symbols-outlined text-[13px] leading-none" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtradas.length > 0 && (
          <div className="px-6 py-3 bg-[#f7f4ee] border-t border-[#e8e4dc] text-xs text-ink-secondary">
            {filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}{search ? ` para "${search}"` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
