'use client'

import { type RefObject } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

export interface BarbeariaRaw {
  id: string
  nome: string
  nicho: string
  plano: string | null
  criado_em: string
  num_barbeiros: number
}
export interface FaturacaoRaw {
  id: string
  valor: number
  gorjeta: number
  tipo: 'servico' | 'produto'
  estado: 'concluido' | 'pendente' | 'desistencia'
  data_hora: string
  servicos: { nome: string } | null
  produtos: { nome: string } | null
}
export interface DespesaRaw {
  id: string
  descricao: string
  valor: number
  categoria: string
  tipo: 'fixo' | 'variavel'
  data: string
}
export interface MarcacaoRaw {
  id: string
  estado: 'pendente' | 'confirmado' | 'concluido' | 'desistencia'
  data_hora: string
}
export interface RelatorioNichoData {
  tipo: 'nicho'
  barbearia: BarbeariaRaw
  faturacao: FaturacaoRaw[]
  despesas: DespesaRaw[]
  marcacoes: MarcacaoRaw[]
}

const PIE_COLORS = ['#0e4324', '#c9a84c', '#2d6a4f', '#d4a843', '#52b788', '#a67c2e', '#1e3a5f', '#6b9fa3', '#e63946', '#457b9d']

const nichoLabel: Record<string, string> = {
  barbeiro: 'Barbearia',
  nails: 'Nails+',
  lash: 'Lash+',
  tatuador: 'Tattoo+',
}

const fmt = (v: number) =>
  v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })

function getMonthlyRevenue(faturacao: FaturacaoRaw[]) {
  const months: Record<string, number> = {}
  for (const f of faturacao.filter(f => f.estado === 'concluido')) {
    const m = f.data_hora.substring(0, 7)
    months[m] = (months[m] ?? 0) + f.valor + (f.gorjeta ?? 0)
  }
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => ({
      mes: new Date(m + '-15').toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }),
      Faturação: +v.toFixed(2),
    }))
}

function getTopServicos(faturacao: FaturacaoRaw[]) {
  const map: Record<string, number> = {}
  for (const f of faturacao.filter(f => f.estado === 'concluido')) {
    const nome = f.servicos?.nome ?? f.produtos?.nome ?? (f.tipo === 'servico' ? 'Serviço s/nome' : 'Produto s/nome')
    map[nome] = (map[nome] ?? 0) + f.valor + (f.gorjeta ?? 0)
  }
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([nome, valor]) => ({ nome, valor: +valor.toFixed(2) }))
}

function getDespesasByCategory(despesas: DespesaRaw[]) {
  const map: Record<string, number> = {}
  for (const d of despesas) {
    map[d.categoria] = (map[d.categoria] ?? 0) + d.valor
  }
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([nome, valor]) => ({ nome, valor: +valor.toFixed(2) }))
}

function generateNichoInsights(
  _barbearia: BarbeariaRaw,
  faturacao: FaturacaoRaw[],
  despesas: DespesaRaw[],
  marcacoes: MarcacaoRaw[],
) {
  const insights: { type: 'positive' | 'warning' | 'negative' | 'info'; text: string }[] = []

  const concluidas = faturacao.filter(f => f.estado === 'concluido')
  const totalFat = concluidas.reduce((s, f) => s + f.valor + (f.gorjeta ?? 0), 0)
  const totalDesp = despesas.reduce((s, d) => s + d.valor, 0)
  const lucro = totalFat - totalDesp
  const margem = totalFat > 0 ? (lucro / totalFat) * 100 : 0

  if (margem >= 40) {
    insights.push({ type: 'positive', text: `Margem de lucro bruta de ${margem.toFixed(0)}% — negócio muito saudável e rentável.` })
  } else if (margem >= 25) {
    insights.push({ type: 'positive', text: `Margem de lucro de ${margem.toFixed(0)}% — boa rentabilidade. Acima da média do sector.` })
  } else if (margem >= 10) {
    insights.push({ type: 'warning', text: `Margem de lucro de ${margem.toFixed(0)}% — razoável mas há margem para otimizar a estrutura de custos.` })
  } else if (margem > 0) {
    insights.push({ type: 'negative', text: `Margem de lucro de apenas ${margem.toFixed(0)}% — negócio em risco. Rever urgentemente despesas fixas.` })
  } else {
    insights.push({ type: 'negative', text: `Prejuízo de ${fmt(Math.abs(lucro))} no período — despesas superiores à faturação. Situação crítica.` })
  }

  if (concluidas.length > 0) {
    const ticket = totalFat / concluidas.length
    const totalGorjetas = concluidas.reduce((s, f) => s + (f.gorjeta ?? 0), 0)
    insights.push({ type: 'info', text: `Ticket médio de ${fmt(ticket)} por atendimento. ${totalGorjetas > 0 ? `Gorjetas totais: ${fmt(totalGorjetas)}.` : ''}` })
  }

  const totalMarcacoes = marcacoes.length
  const marcConcluidas = marcacoes.filter(m => m.estado === 'concluido').length
  const marcDesistencias = marcacoes.filter(m => m.estado === 'desistencia').length
  if (totalMarcacoes > 0) {
    const taxa = ((marcConcluidas / totalMarcacoes) * 100).toFixed(0)
    if (parseInt(taxa) >= 80) {
      insights.push({ type: 'positive', text: `Taxa de conversão de marcações de ${taxa}% — excelente. ${marcDesistencias} desistência${marcDesistencias !== 1 ? 's' : ''} no período.` })
    } else if (parseInt(taxa) >= 60) {
      insights.push({ type: 'warning', text: `Taxa de conversão de ${taxa}% — ${marcDesistencias} desistência${marcDesistencias !== 1 ? 's' : ''}. Considerar SMS de confirmação.` })
    } else {
      insights.push({ type: 'negative', text: `Taxa de conversão de apenas ${taxa}% — ${marcDesistencias} desistências. Problema de no-shows a resolver.` })
    }
  }

  const despCats = getDespesasByCategory(despesas)
  if (despCats.length > 0) {
    const [topCat, topVal] = [despCats[0].nome, despCats[0].valor]
    const pct = totalDesp > 0 ? ((topVal / totalDesp) * 100).toFixed(0) : '0'
    insights.push({ type: 'info', text: `Maior categoria de despesa: ${topCat} (${pct}% do total — ${fmt(topVal)}).` })
  }

  const despsFixas = despesas.filter(d => d.tipo === 'fixo').reduce((s, d) => s + d.valor, 0)
  const despsVariaveis = despesas.filter(d => d.tipo === 'variavel').reduce((s, d) => s + d.valor, 0)
  if (despsFixas + despsVariaveis > 0) {
    const pctFixo = ((despsFixas / (despsFixas + despsVariaveis)) * 100).toFixed(0)
    insights.push({ type: 'info', text: `Estrutura de custos: ${pctFixo}% fixos (${fmt(despsFixas)}) vs ${100 - parseInt(pctFixo)}% variáveis (${fmt(despsVariaveis)}).` })
  }

  const topServicos = getTopServicos(faturacao)
  if (topServicos.length > 0) {
    const totalFatServicos = topServicos.reduce((s, x) => s + x.valor, 0)
    const topPct = totalFatServicos > 0 ? ((topServicos[0].valor / totalFatServicos) * 100).toFixed(0) : '0'
    insights.push({ type: 'info', text: `Serviço mais rentável: "${topServicos[0].nome}" (${topPct}% da faturação — ${fmt(topServicos[0].valor)}).` })
  }

  return insights
}

const insightColors: Record<string, string> = {
  positive: '#0e4324', warning: '#92400e', negative: '#991b1b', info: '#1e3a5f',
}
const insightBg: Record<string, string> = {
  positive: '#f0fdf4', warning: '#fffbeb', negative: '#fef2f2', info: '#eff6ff',
}
const insightIcon: Record<string, string> = {
  positive: 'check_circle', warning: 'warning', negative: 'error', info: 'info',
}

export default function RelatorioNicho({
  data,
  clienteNome,
  periodoLabel,
  reportRef,
  onExportPDF,
  exporting,
}: {
  data: RelatorioNichoData
  clienteNome: string
  periodoLabel: string
  reportRef: RefObject<HTMLDivElement | null>
  onExportPDF: () => void
  exporting: boolean
}) {
  const { barbearia, faturacao, despesas, marcacoes } = data

  const concluidas = faturacao.filter(f => f.estado === 'concluido')
  const totalFat = concluidas.reduce((s, f) => s + f.valor + (f.gorjeta ?? 0), 0)
  const totalGorjetas = concluidas.reduce((s, f) => s + (f.gorjeta ?? 0), 0)
  const totalDesp = despesas.reduce((s, d) => s + d.valor, 0)
  const lucro = totalFat - totalDesp
  const margem = totalFat > 0 ? (lucro / totalFat) * 100 : 0
  const ticketMedio = concluidas.length > 0 ? totalFat / concluidas.length : 0

  const marcConcluidas = marcacoes.filter(m => m.estado === 'concluido').length
  const marcDesistencias = marcacoes.filter(m => m.estado === 'desistencia').length
  const taxaConversao = marcacoes.length > 0 ? (marcConcluidas / marcacoes.length) * 100 : 0

  const monthlyData = getMonthlyRevenue(faturacao)
  const topServicos = getTopServicos(faturacao)
  const despCats = getDespesasByCategory(despesas)
  const insights = generateNichoInsights(barbearia, faturacao, despesas, marcacoes)

  const pieServicos = topServicos.slice(0, 8).map(s => ({ name: s.nome, value: s.valor }))
  const pieDesp = despCats.slice(0, 8).map(d => ({ name: d.nome, value: d.valor }))
  const totalFatServicos = topServicos.reduce((s, x) => s + x.valor, 0)

  const nichoPrimary = barbearia.nicho === 'nails' ? '#c2185b' : barbearia.nicho === 'lash' ? '#4a148c' : barbearia.nicho === 'tatuador' ? '#111111' : '#2d2d2d'

  return (
    <div>
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={onExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: nichoPrimary }}
        >
          <span className="material-symbols-outlined text-[16px] leading-none">picture_as_pdf</span>
          {exporting ? 'A gerar PDF...' : 'Exportar PDF'}
        </button>
      </div>

      <div ref={reportRef as RefObject<HTMLDivElement>} className="space-y-6" style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px' }}>

        {/* Header */}
        <div className="rounded-xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${nichoPrimary} 0%, ${nichoPrimary}cc 100%)` }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase opacity-60 mb-1">
                Relatório de Consultoria — {nichoLabel[barbearia.nicho] ?? barbearia.nicho}
              </p>
              <h2 className="text-2xl font-bold mb-0.5">{clienteNome}</h2>
              <p className="opacity-70 text-sm">{periodoLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-50">Gerado em</p>
              <p className="text-sm font-medium">{new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p className="mt-2 text-xs opacity-60">{concluidas.length} atendimentos · {marcacoes.length} marcações</p>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Faturado', value: fmt(totalFat), icon: 'payments', color: '#0e4324', bg: '#f0fdf4' },
            { label: 'Total Despesas', value: fmt(totalDesp), icon: 'receipt_long', color: '#991b1b', bg: '#fef2f2' },
            { label: 'Lucro Bruto', value: fmt(lucro), icon: 'account_balance', color: lucro >= 0 ? '#0e4324' : '#991b1b', bg: lucro >= 0 ? '#f0fdf4' : '#fef2f2' },
            { label: 'Margem de Lucro', value: `${margem.toFixed(1)}%`, icon: 'percent', color: margem >= 25 ? '#0e4324' : margem >= 10 ? '#92400e' : '#991b1b', bg: margem >= 25 ? '#f0fdf4' : margem >= 10 ? '#fffbeb' : '#fef2f2' },
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

        {/* Secondary KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Ticket Médio', value: fmt(ticketMedio), icon: 'sell' },
            { label: 'Gorjetas', value: fmt(totalGorjetas), icon: 'volunteer_activism' },
            { label: 'Marcações Concluídas', value: `${marcConcluidas} / ${marcacoes.length}`, icon: 'event_available' },
            { label: 'Taxa de Conversão', value: `${taxaConversao.toFixed(0)}%`, icon: 'conversion_path' },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-4 border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50">
                  <span className="material-symbols-outlined text-[16px] text-gray-500">{k.icon}</span>
                </div>
                <p className="text-xs text-gray-500">{k.label}</p>
              </div>
              <p className="text-xl font-bold text-gray-800">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Monthly revenue chart */}
        {monthlyData.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Evolução da Faturação Mensal</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tickFormatter={v => `€${v}`} tick={{ fontSize: 10, fill: '#6b7280' }} width={70} />
                <Tooltip formatter={(v) => [fmt(Number(v)), '']} />
                <Bar dataKey="Faturação" fill={nichoPrimary} radius={[3, 3, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top services + Expenses breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top services */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Top Serviços / Produtos</h3>
            {topServicos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sem faturação no período</p>
            ) : (
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <PieChart width={140} height={140}>
                    <Pie data={pieServicos} cx={65} cy={65} innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                      {pieServicos.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [fmt(Number(v)), '']} />
                  </PieChart>
                </div>
                <div className="flex-1 space-y-1.5 overflow-hidden">
                  {topServicos.slice(0, 7).map((s, i) => (
                    <div key={s.nome} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs text-gray-600 truncate">{s.nome}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-800">{fmt(s.valor)}</span>
                        <span className="text-[10px] text-gray-400 ml-1">{totalFatServicos > 0 ? ((s.valor / totalFatServicos) * 100).toFixed(0) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Expense breakdown */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Despesas por Categoria</h3>
            {despCats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sem despesas no período</p>
            ) : (
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <PieChart width={140} height={140}>
                    <Pie data={pieDesp} cx={65} cy={65} innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                      {pieDesp.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [fmt(Number(v)), '']} />
                  </PieChart>
                </div>
                <div className="flex-1 space-y-1.5 overflow-hidden">
                  {despCats.slice(0, 7).map((d, i) => (
                    <div key={d.nome} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs text-gray-600 truncate">{d.nome}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-800">{fmt(d.valor)}</span>
                        <span className="text-[10px] text-gray-400 ml-1">{totalDesp > 0 ? ((d.valor / totalDesp) * 100).toFixed(0) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Appointment breakdown table */}
        {marcacoes.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Detalhe de Marcações</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total', value: marcacoes.length, icon: 'calendar_month', color: '#374151' },
                { label: 'Concluídas', value: marcConcluidas, icon: 'event_available', color: '#0e4324' },
                { label: 'Pendentes / Confirmadas', value: marcacoes.filter(m => m.estado === 'pendente' || m.estado === 'confirmado').length, icon: 'schedule', color: '#92400e' },
                { label: 'Desistências', value: marcDesistencias, icon: 'event_busy', color: '#991b1b' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-lg bg-gray-50">
                  <span className="material-symbols-outlined text-[22px] mb-1" style={{ color: s.color }}>{s.icon}</span>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="rounded-xl p-5 border" style={{ backgroundColor: '#f9f7f2', borderColor: '#e8dfc8' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px]" style={{ color: nichoPrimary }}>psychology</span>
              <h3 className="text-sm font-bold" style={{ color: nichoPrimary }}>Análise do Consultor</h3>
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

        {faturacao.length === 0 && despesas.length === 0 && marcacoes.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
            <span className="material-symbols-outlined text-[40px] text-gray-300 block mb-3">inbox</span>
            <p className="text-sm text-gray-400">Sem dados registados no período selecionado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
