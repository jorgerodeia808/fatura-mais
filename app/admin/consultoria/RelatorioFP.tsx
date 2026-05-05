'use client'

import { type RefObject } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

export interface TransacaoRaw {
  id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  data: string
  categoria_id: string | null
  fp_categorias: { nome: string; cor: string; icone: string } | null
}
export interface OrcamentoRaw {
  id: string
  categoria_id: string
  valor_limite: number
  mes: string
  fp_categorias: { nome: string; cor: string } | null
}
export interface ObjetivoRaw {
  id: string
  nome: string
  valor_objetivo: number
  valor_atual: number
  data_limite: string | null
  ativo: boolean
}
export interface RecorrenteRaw {
  id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  dia_do_mes: number
  fp_categorias: { nome: string; cor: string } | null
}
export interface PerfilFPRaw {
  plano: string | null
  criado_em: string
  subscricao_renovacao: string | null
}

export interface RelatorioFPData {
  tipo: 'fp'
  transacoes: TransacaoRaw[]
  orcamentos: OrcamentoRaw[]
  objetivos: ObjetivoRaw[]
  recorrentes: RecorrenteRaw[]
  perfil: PerfilFPRaw | null
}

const PIE_COLORS = ['#0e4324', '#c9a84c', '#2d6a4f', '#d4a843', '#52b788', '#a67c2e', '#1e3a5f', '#6b9fa3', '#e63946', '#457b9d']

const fmt = (v: number) =>
  v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })

function getMonthlyData(transacoes: TransacaoRaw[]) {
  const months: Record<string, { Receitas: number; Despesas: number }> = {}
  for (const t of transacoes) {
    const m = t.data.substring(0, 7)
    if (!months[m]) months[m] = { Receitas: 0, Despesas: 0 }
    if (t.tipo === 'receita') months[m].Receitas += t.valor
    else months[m].Despesas += t.valor
  }
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, d]) => ({
      mes: new Date(m + '-15').toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }),
      Receitas: +d.Receitas.toFixed(2),
      Despesas: +d.Despesas.toFixed(2),
    }))
}

function getCatBreakdown(transacoes: TransacaoRaw[], tipo: 'receita' | 'despesa') {
  const map: Record<string, { nome: string; cor: string; valor: number }> = {}
  for (const t of transacoes.filter(x => x.tipo === tipo)) {
    const id = t.categoria_id ?? 'sem_cat'
    const nome = t.fp_categorias?.nome ?? 'Sem categoria'
    const cor = t.fp_categorias?.cor ?? '#9ca3af'
    if (!map[id]) map[id] = { nome, cor, valor: 0 }
    map[id].valor += t.valor
  }
  return Object.values(map).sort((a, b) => b.valor - a.valor)
}

function getBudgetItems(orcamentos: OrcamentoRaw[], transacoes: TransacaoRaw[]) {
  const bycat: Record<string, { nome: string; cor: string; limite: number; gasto: number }> = {}
  for (const orc of orcamentos) {
    const cid = orc.categoria_id
    const nome = orc.fp_categorias?.nome ?? 'Sem categoria'
    const cor = orc.fp_categorias?.cor ?? '#9ca3af'
    if (!bycat[cid]) bycat[cid] = { nome, cor, limite: 0, gasto: 0 }
    bycat[cid].limite += orc.valor_limite
    const gasto = transacoes
      .filter(t => t.categoria_id === cid && t.data.startsWith(orc.mes) && t.tipo === 'despesa')
      .reduce((s, t) => s + t.valor, 0)
    bycat[cid].gasto += gasto
  }
  return Object.values(bycat).sort((a, b) => b.gasto - a.gasto)
}

function generateInsights(
  transacoes: TransacaoRaw[],
  orcamentos: OrcamentoRaw[],
  objetivos: ObjetivoRaw[],
  recorrentes: RecorrenteRaw[],
) {
  const insights: { type: 'positive' | 'warning' | 'negative' | 'info'; text: string }[] = []
  const receitas = transacoes.filter(t => t.tipo === 'receita')
  const despesas = transacoes.filter(t => t.tipo === 'despesa')
  const totalR = receitas.reduce((s, t) => s + t.valor, 0)
  const totalD = despesas.reduce((s, t) => s + t.valor, 0)
  const saldo = totalR - totalD
  const taxa = totalR > 0 ? (saldo / totalR) * 100 : 0

  if (taxa >= 20) {
    insights.push({ type: 'positive', text: `Taxa de poupança de ${taxa.toFixed(0)}% — excelente disciplina financeira. Acima dos 20% recomendados.` })
  } else if (taxa >= 10) {
    insights.push({ type: 'warning', text: `Taxa de poupança de ${taxa.toFixed(0)}% — razoável, mas abaixo dos 20% recomendados. Há margem para melhorar.` })
  } else if (taxa > 0) {
    insights.push({ type: 'negative', text: `Taxa de poupança de apenas ${taxa.toFixed(0)}% — significativamente abaixo do ideal. Rever despesas não essenciais.` })
  } else if (saldo < 0) {
    insights.push({ type: 'negative', text: `Saldo negativo de ${fmt(Math.abs(saldo))} no período — despesas superiores às receitas. Situação crítica a resolver.` })
  }

  const catTotals: Record<string, number> = {}
  for (const t of despesas) {
    const nome = t.fp_categorias?.nome ?? 'Sem categoria'
    catTotals[nome] = (catTotals[nome] ?? 0) + t.valor
  }
  const sortedCats = Object.entries(catTotals).sort(([, a], [, b]) => b - a)
  if (sortedCats.length > 0) {
    const [topCat, topVal] = sortedCats[0]
    const pct = totalD > 0 ? ((topVal / totalD) * 100).toFixed(0) : '0'
    insights.push({ type: 'info', text: `Maior área de despesa: ${topCat} (${pct}% do total — ${fmt(topVal)}). Avaliar se está alinhada com as prioridades.` })
  }

  if (orcamentos.length > 0) {
    const budgets = getBudgetItems(orcamentos, transacoes)
    const within = budgets.filter(b => b.gasto <= b.limite).length
    const pct = Math.round((within / budgets.length) * 100)
    if (pct >= 80) {
      insights.push({ type: 'positive', text: `${pct}% dos orçamentos respeitados no período — boa gestão das categorias definidas.` })
    } else {
      const over = budgets.filter(b => b.gasto > b.limite)
      const overNames = over.slice(0, 2).map(b => b.nome).join(', ')
      insights.push({ type: 'warning', text: `Apenas ${pct}% dos orçamentos cumpridos. Categorias em excesso: ${overNames}.` })
    }
  }

  const recMensal = recorrentes.filter(r => r.tipo === 'despesa').reduce((s, r) => s + r.valor, 0)
  if (recMensal > 0 && totalR > 0) {
    const comprometido = (recMensal / (totalR / Math.max(1, Object.keys(getMonthlyData(transacoes)).length))) * 100
    const label = comprometido > 50
      ? { type: 'warning' as const, suffix: '— alto nível de compromisso. Avaliar se existem subscrições desnecessárias.' }
      : { type: 'info' as const, suffix: '' }
    insights.push({ type: label.type, text: `Pagamentos recorrentes: ${fmt(recMensal)}/mês em compromissos fixos. ${label.suffix}` })
  }

  if (objetivos.length > 0) {
    const avgProg = objetivos.reduce((s, o) => s + Math.min(100, o.valor_objetivo > 0 ? (o.valor_atual / o.valor_objetivo) * 100 : 0), 0) / objetivos.length
    if (avgProg >= 70) {
      insights.push({ type: 'positive', text: `Objetivos de poupança com progresso médio de ${avgProg.toFixed(0)}% — bom ritmo de acumulação.` })
    } else {
      insights.push({ type: 'info', text: `Objetivos de poupança com progresso médio de ${avgProg.toFixed(0)}%. Considere aumentar as contribuições mensais.` })
    }
  }

  return insights
}

const insightIcon: Record<string, string> = {
  positive: 'check_circle',
  warning: 'warning',
  negative: 'error',
  info: 'info',
}
const insightColors: Record<string, string> = {
  positive: '#0e4324',
  warning: '#92400e',
  negative: '#991b1b',
  info: '#1e3a5f',
}
const insightBg: Record<string, string> = {
  positive: '#f0fdf4',
  warning: '#fffbeb',
  negative: '#fef2f2',
  info: '#eff6ff',
}

export default function RelatorioFP({
  data,
  clienteNome,
  periodoLabel,
  reportRef,
  onExportPDF,
  exporting,
}: {
  data: RelatorioFPData
  clienteNome: string
  periodoLabel: string
  reportRef: RefObject<HTMLDivElement | null>
  onExportPDF: () => void
  exporting: boolean
}) {
  const { transacoes, orcamentos, objetivos, recorrentes } = data

  const totalR = transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const totalD = transacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const saldo = totalR - totalD
  const taxa = totalR > 0 ? (saldo / totalR) * 100 : 0

  const monthlyData = getMonthlyData(transacoes)
  const despCats = getCatBreakdown(transacoes, 'despesa')
  const recCats = getCatBreakdown(transacoes, 'receita')
  const budgetItems = getBudgetItems(orcamentos, transacoes)
  const insights = generateInsights(transacoes, orcamentos, objetivos, recorrentes)

  const recorrentesD = recorrentes.filter(r => r.tipo === 'despesa')
  const recorrentesR = recorrentes.filter(r => r.tipo === 'receita')
  const totalRecD = recorrentesD.reduce((s, r) => s + r.valor, 0)
  const totalRecR = recorrentesR.reduce((s, r) => s + r.valor, 0)

  const pieDataDespesas = despCats.slice(0, 8).map(c => ({ name: c.nome, value: +c.valor.toFixed(2) }))
  const pieDataReceitas = recCats.slice(0, 8).map(c => ({ name: c.nome, value: +c.valor.toFixed(2) }))

  return (
    <div>
      {/* Export button */}
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={onExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <span className="material-symbols-outlined text-[16px] leading-none">picture_as_pdf</span>
          {exporting ? 'A gerar PDF...' : 'Exportar PDF'}
        </button>
      </div>

      <div ref={reportRef as RefObject<HTMLDivElement>} className="space-y-6" style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px' }}>

        {/* Report header */}
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-blue-200 mb-1">Relatório de Consultoria — FP+</p>
              <h2 className="text-2xl font-bold mb-0.5">{clienteNome}</h2>
              <p className="text-blue-200 text-sm">{periodoLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-300">Gerado em</p>
              <p className="text-sm font-medium">{new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p className="mt-2 text-xs text-blue-200">{transacoes.length} transações analisadas</p>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Receitas', value: fmt(totalR), icon: 'trending_up', color: '#0e4324', bg: '#f0fdf4' },
            { label: 'Total Despesas', value: fmt(totalD), icon: 'trending_down', color: '#991b1b', bg: '#fef2f2' },
            { label: 'Saldo Líquido', value: fmt(saldo), icon: 'account_balance_wallet', color: saldo >= 0 ? '#0e4324' : '#991b1b', bg: saldo >= 0 ? '#f0fdf4' : '#fef2f2' },
            { label: 'Taxa de Poupança', value: `${taxa.toFixed(1)}%`, icon: 'savings', color: taxa >= 20 ? '#0e4324' : taxa >= 10 ? '#92400e' : '#991b1b', bg: taxa >= 20 ? '#f0fdf4' : taxa >= 10 ? '#fffbeb' : '#fef2f2' },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-4 border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: k.bg }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ color: k.color }}>{k.icon}</span>
                </div>
                <p className="text-xs text-gray-500">{k.label}</p>
              </div>
              <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Monthly cashflow chart */}
        {monthlyData.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Fluxo de Caixa Mensal</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tickFormatter={v => `€${v}`} tick={{ fontSize: 10, fill: '#6b7280' }} width={70} />
                <Tooltip formatter={(v) => [fmt(Number(v)), '']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receitas" fill="#0e4324" radius={[3, 3, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Despesas" fill="#e53e3e" radius={[3, 3, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {/* Despesas por categoria */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Despesas por Categoria</h3>
            {despCats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sem despesas no período</p>
            ) : (
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <PieChart width={140} height={140}>
                    <Pie data={pieDataDespesas} cx={65} cy={65} innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                      {pieDataDespesas.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [fmt(Number(v)), '']} />
                  </PieChart>
                </div>
                <div className="flex-1 space-y-1.5 overflow-hidden">
                  {despCats.slice(0, 7).map((c, i) => (
                    <div key={c.nome} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs text-gray-600 truncate">{c.nome}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-800">{fmt(c.valor)}</span>
                        <span className="text-[10px] text-gray-400 ml-1">{totalD > 0 ? ((c.valor / totalD) * 100).toFixed(0) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Receitas por categoria */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Receitas por Categoria</h3>
            {recCats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sem receitas no período</p>
            ) : (
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <PieChart width={140} height={140}>
                    <Pie data={pieDataReceitas} cx={65} cy={65} innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                      {pieDataReceitas.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [fmt(Number(v)), '']} />
                  </PieChart>
                </div>
                <div className="flex-1 space-y-1.5 overflow-hidden">
                  {recCats.slice(0, 7).map((c, i) => (
                    <div key={c.nome} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs text-gray-600 truncate">{c.nome}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-800">{fmt(c.valor)}</span>
                        <span className="text-[10px] text-gray-400 ml-1">{totalR > 0 ? ((c.valor / totalR) * 100).toFixed(0) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Budget adherence */}
        {budgetItems.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Aderência a Orçamentos</h3>
            <div className="space-y-3">
              {budgetItems.map(b => {
                const pct = b.limite > 0 ? Math.min(100, (b.gasto / b.limite) * 100) : 0
                const over = b.gasto > b.limite
                return (
                  <div key={b.nome}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{b.nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{fmt(b.gasto)} / {fmt(b.limite)}</span>
                        {over && (
                          <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            +{fmt(b.gasto - b.limite)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: over ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#0e4324',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Goals */}
        {objetivos.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Objetivos de Poupança</h3>
            <div className="space-y-4">
              {objetivos.map(o => {
                const pct = o.valor_objetivo > 0 ? Math.min(100, (o.valor_atual / o.valor_objetivo) * 100) : 0
                const faltam = Math.max(0, o.valor_objetivo - o.valor_atual)
                const diasRestantes = o.data_limite
                  ? Math.ceil((new Date(o.data_limite).getTime() - Date.now()) / 86400000)
                  : null
                return (
                  <div key={o.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{o.nome}</span>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {diasRestantes !== null && (
                          <span>{diasRestantes > 0 ? `${diasRestantes} dias` : 'Prazo atingido'}</span>
                        )}
                        <span className="font-semibold text-gray-700">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
                      <div
                        className="h-2.5 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#0e4324' : '#c9a84c' }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>{fmt(o.valor_atual)} acumulado</span>
                      <span>{fmt(o.valor_objetivo)} objetivo{faltam > 0 ? ` — faltam ${fmt(faltam)}` : ' ✓'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recurring payments */}
        {recorrentes.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Pagamentos Recorrentes</h3>
              <div className="flex gap-4 text-xs text-gray-500">
                {totalRecD > 0 && <span className="text-red-600 font-semibold">−{fmt(totalRecD)}/mês em despesas</span>}
                {totalRecR > 0 && <span className="text-green-700 font-semibold">+{fmt(totalRecR)}/mês em receitas</span>}
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Descrição</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Categoria</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Dia</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {recorrentes.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-2 text-xs text-gray-800">{r.descricao}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{r.fp_categorias?.nome ?? '—'}</td>
                      <td className="px-3 py-2 text-xs text-gray-500 text-center">dia {r.dia_do_mes}</td>
                      <td className={`px-3 py-2 text-xs font-semibold text-right ${r.tipo === 'receita' ? 'text-green-700' : 'text-red-600'}`}>
                        {r.tipo === 'receita' ? '+' : '−'}{fmt(r.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Auto-generated insights */}
        {insights.length > 0 && (
          <div className="rounded-xl p-5 border border-blue-100" style={{ backgroundColor: '#f0f4ff' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#1e3a5f' }}>psychology</span>
              <h3 className="text-sm font-bold" style={{ color: '#1e3a5f' }}>Análise do Consultor</h3>
            </div>
            <div className="space-y-2">
              {insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: insightBg[ins.type] }}>
                  <span
                    className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5"
                    style={{ color: insightColors[ins.type], fontVariationSettings: "'FILL' 1" }}
                  >
                    {insightIcon[ins.type]}
                  </span>
                  <p className="text-xs leading-relaxed" style={{ color: insightColors[ins.type] }}>{ins.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {transacoes.length === 0 && objetivos.length === 0 && recorrentes.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
            <span className="material-symbols-outlined text-[40px] text-gray-300 block mb-3">inbox</span>
            <p className="text-sm text-gray-400">Sem dados registados no período selecionado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
