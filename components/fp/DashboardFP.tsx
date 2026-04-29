'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const FP_PRIMARY = '#1e3a5f'
const FP_ACCENT = '#c9a84c'

const fmt = (v: number) =>
  v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })

interface TransacaoRecente {
  id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  data: string
  fp_categorias?: { nome: string; icone: string; cor: string } | null
}

interface OrcamentoProgress {
  categoria: string
  icone: string
  cor: string
  limite: number
  gasto: number
}

interface MesData {
  mes: string
  receitas: number
  despesas: number
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-slate-400">N/D</span>
  const up = value >= 0
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
        {up ? 'arrow_upward' : 'arrow_downward'}
      </span>
      {Math.abs(value).toFixed(1)}% vs ant.
    </span>
  )
}

export default function DashboardFP() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [recentes, setRecentes] = useState<TransacaoRecente[]>([])
  const [orcamentos, setOrcamentos] = useState<OrcamentoProgress[]>([])
  const [historico, setHistorico] = useState<MesData[]>([])
  const [stats, setStats] = useState({
    receitas: 0,
    despesas: 0,
    resultado: 0,
    receitasPrev: 0,
    despesasPrev: 0,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = hoje.getMonth() + 1
    const mesStr = `${ano}-${String(mes).padStart(2, '0')}`
    const mesStart = `${mesStr}-01`
    const mesEnd = new Date(ano, mes, 0).toISOString().split('T')[0]

    const prevDate = new Date(ano, mes - 2, 1)
    const prevAno = prevDate.getFullYear()
    const prevMes = prevDate.getMonth() + 1
    const prevMesStr = `${prevAno}-${String(prevMes).padStart(2, '0')}`
    const prevStart = `${prevMesStr}-01`
    const prevEnd = new Date(prevAno, prevMes, 0).toISOString().split('T')[0]

    const [
      { data: txAtual },
      { data: txPrev },
      { data: rec },
      { data: buds },
    ] = await Promise.all([
      supabase.from('fp_transacoes').select('tipo, valor').eq('user_id', user.id).gte('data', mesStart).lte('data', mesEnd),
      supabase.from('fp_transacoes').select('tipo, valor').eq('user_id', user.id).gte('data', prevStart).lte('data', prevEnd),
      supabase.from('fp_transacoes').select('id, descricao, valor, tipo, data, fp_categorias(nome, icone, cor)').eq('user_id', user.id).order('data', { ascending: false }).limit(5),
      supabase.from('fp_orcamentos').select('valor_limite, categoria_id, fp_categorias(nome, icone, cor)').eq('user_id', user.id).eq('mes', mesStr),
    ])

    const receitas = (txAtual ?? []).filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
    const despesas = (txAtual ?? []).filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
    const receitasPrev = (txPrev ?? []).filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
    const despesasPrev = (txPrev ?? []).filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
    setStats({ receitas, despesas, resultado: receitas - despesas, receitasPrev, despesasPrev })
    setRecentes((rec as unknown as TransacaoRecente[]) ?? [])

    if (buds && buds.length > 0) {
      const catIds = buds.map(b => b.categoria_id).filter(Boolean)
      const { data: gastos } = await supabase
        .from('fp_transacoes')
        .select('categoria_id, valor')
        .eq('user_id', user.id)
        .eq('tipo', 'despesa')
        .gte('data', mesStart)
        .lte('data', mesEnd)
        .in('categoria_id', catIds)

      const gastoMap: Record<string, number> = {}
      ;(gastos ?? []).forEach(t => {
        gastoMap[t.categoria_id] = (gastoMap[t.categoria_id] ?? 0) + t.valor
      })
      setOrcamentos(buds.map(b => {
        const cat = b.fp_categorias as unknown as { nome: string; icone: string; cor: string } | null
        return {
          categoria: cat?.nome ?? 'Sem nome',
          icone: cat?.icone ?? 'category',
          cor: cat?.cor ?? '#64748b',
          limite: b.valor_limite,
          gasto: gastoMap[b.categoria_id] ?? 0,
        }
      }))
    }

    const sixStart = new Date(ano, mes - 7, 1).toISOString().split('T')[0]
    const { data: hist } = await supabase
      .from('fp_transacoes')
      .select('tipo, valor, data')
      .eq('user_id', user.id)
      .gte('data', sixStart)

    const meses: MesData[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ano, mes - 1 - i, 1)
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('pt-PT', { month: 'short' })
      const txM = (hist ?? []).filter(t => t.data.startsWith(mKey))
      meses.push({
        mes: label,
        receitas: txM.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0),
        despesas: txM.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0),
      })
    }
    setHistorico(meses)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const trendReceitas = stats.receitasPrev > 0 ? ((stats.receitas - stats.receitasPrev) / stats.receitasPrev) * 100 : null
  const trendDespesas = stats.despesasPrev > 0 ? ((stats.despesas - stats.despesasPrev) / stats.despesasPrev) * 100 : null
  const taxaPoupanca = stats.receitas > 0 ? (stats.resultado / stats.receitas) * 100 : null
  const mesAtualLabel = new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
  const diaSemana = new Date().toLocaleDateString('pt-PT', { weekday: 'long' })

  const cards = [
    { label: 'Receitas', value: fmt(stats.receitas), trend: trendReceitas, icon: 'arrow_upward', color: '#16a34a' },
    { label: 'Despesas', value: fmt(stats.despesas), trend: trendDespesas !== null ? -trendDespesas : null, icon: 'arrow_downward', color: '#dc2626' },
    { label: 'Resultado', value: fmt(stats.resultado), trend: null, icon: stats.resultado >= 0 ? 'trending_up' : 'trending_down', color: stats.resultado >= 0 ? '#16a34a' : '#dc2626' },
    {
      label: 'Taxa poupança',
      value: taxaPoupanca !== null ? `${taxaPoupanca.toFixed(0)}%` : '—',
      trend: null,
      icon: 'savings',
      color: FP_ACCENT,
      sub: 'do rendimento',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize" style={{ color: FP_PRIMARY }}>
            {diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 capitalize">{mesAtualLabel}</p>
        </div>
        <Link
          href="/transacoes"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: FP_PRIMARY }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Nova transação
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${card.color}18` }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: card.color }}>{card.icon}</span>
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <p className="text-2xl font-bold mb-1" style={{ color: card.color }}>{card.value}</p>
            )}
            {!loading && (card.trend !== undefined && card.trend !== null
              ? <TrendBadge value={card.trend} />
              : card.sub ? <p className="text-xs text-slate-400">{card.sub}</p> : null
            )}
          </div>
        ))}
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 lg:col-span-3">
          <h2 className="font-semibold text-sm mb-4" style={{ color: FP_PRIMARY }}>
            Histórico — últimos 6 meses
          </h2>
          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={historico} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(v, name) => [fmt(typeof v === 'number' ? v : 0), String(name) === 'receitas' ? 'Receitas' : 'Despesas']}
                />
                <Bar dataKey="receitas" name="receitas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="despesas" fill="#dc2626" opacity={0.7} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: FP_PRIMARY }}>Recentes</h2>
            <Link href="/transacoes" className="text-xs font-medium" style={{ color: FP_ACCENT }}>Ver todas →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : recentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="material-symbols-outlined text-slate-300 mb-2" style={{ fontSize: '32px' }}>receipt_long</span>
              <p className="text-sm text-slate-400">Sem transações</p>
              <Link href="/transacoes" className="text-xs mt-2 font-medium" style={{ color: FP_ACCENT }}>Adicionar →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentes.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: t.tipo === 'receita' ? '#16a34a18' : '#dc262618' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: t.tipo === 'receita' ? '#16a34a' : '#dc2626' }}>
                      {t.fp_categorias?.icone ?? (t.tipo === 'receita' ? 'arrow_upward' : 'arrow_downward')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{t.descricao}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <p className="text-xs font-bold flex-shrink-0" style={{ color: t.tipo === 'receita' ? '#16a34a' : '#dc2626' }}>
                    {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Budget progress */}
      {!loading && orcamentos.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: FP_PRIMARY }}>
              Orçamentos — <span className="capitalize">{mesAtualLabel}</span>
            </h2>
            <Link href="/orcamentos" className="text-xs font-medium" style={{ color: FP_ACCENT }}>Gerir →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orcamentos.map(o => {
              const pct = Math.min((o.gasto / o.limite) * 100, 100)
              const barColor = pct >= 90 ? '#dc2626' : pct >= 70 ? '#f59e0b' : '#16a34a'
              return (
                <div key={o.categoria} className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: o.cor }}>{o.icone}</span>
                    <span className="text-xs font-medium text-slate-600 flex-1 truncate">{o.categoria}</span>
                    <span className="text-xs text-slate-400">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{fmt(o.gasto)}</span>
                    <span>{fmt(o.limite)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick links when no budgets */}
      {!loading && orcamentos.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/recorrentes', icon: 'autorenew', label: 'Recorrentes', desc: 'Pagamentos fixos mensais' },
            { href: '/orcamentos', icon: 'pie_chart', label: 'Orçamentos', desc: 'Define limites por categoria' },
            { href: '/objetivos', icon: 'flag', label: 'Objetivos', desc: 'Metas de poupança' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 hover:border-slate-200 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${FP_PRIMARY}10` }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: FP_PRIMARY }}>{item.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <span className="material-symbols-outlined ml-auto text-slate-300 group-hover:text-slate-400 transition-colors" style={{ fontSize: '16px' }}>chevron_right</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
