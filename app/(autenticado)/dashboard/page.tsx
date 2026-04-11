'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────
interface Barbearia {
  id: string
  nome: string
  num_barbeiros: number
  hora_abertura: string
  hora_fecho: string
  dias_trabalho_mes: number
}

interface FaturacaoRow {
  id: string
  valor: number
  gorjeta: number
  data_hora: string
  servico_id: string | null
  servicos?: { nome: string; tempo_minutos: number } | null
}

interface DespesaRow {
  valor: number
  data: string
}

interface ServicoRow {
  id: string
  nome: string
  preco: number
  custo_material: number
  tempo_minutos: number
  ativo: boolean
}

interface CustoFixoRow {
  valor: number
  tipo: string
}

interface MonthData {
  mes: string
  faturacao: number
  despesas: number
}

interface TopServico {
  nome: string
  volume: number
  total: number
}

interface HealthMetric {
  label: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  description: string
}

// ── Helpers ────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

function getMonthRange(monthsAgo = 0) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() - monthsAgo
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)
  return { start, end }
}

function monthLabel(monthsAgo: number) {
  const { start } = getMonthRange(monthsAgo)
  return start.toLocaleDateString('pt-PT', { month: 'short' })
}

// ── Loading Skeleton ────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

// ── KPI Card ────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon,
  color,
  loading,
  sub,
}: {
  label: string
  value: string
  icon: string
  color: string
  loading: boolean
  sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {sub && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>
            {sub}
          </span>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-4 w-24" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-[#0e4324]">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{label}</p>
        </>
      )}
    </div>
  )
}

// ── Health Score ────────────────────────────────────────────────────
function HealthScoreCard({
  score,
  metrics,
  loading,
}: {
  score: number
  metrics: HealthMetric[]
  loading: boolean
}) {
  const status =
    score >= 80 ? 'Excelente' : score >= 60 ? 'Bom' : score >= 40 ? 'A melhorar' : 'Crítico'
  const statusColor =
    score >= 80
      ? 'text-green-600'
      : score >= 60
      ? 'text-[#977c30]'
      : score >= 40
      ? 'text-orange-500'
      : 'text-red-600'
  const ringColor =
    score >= 80
      ? '#16a34a'
      : score >= 60
      ? '#977c30'
      : score >= 40
      ? '#f97316'
      : '#dc2626'

  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Health Score</h3>
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-28 h-28 rounded-full" />
          <Skeleton className="w-full h-16" />
        </div>
      ) : (
        <>
          {/* Ring */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <svg width="112" height="112" className="-rotate-90">
                <circle cx="56" cy="56" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle
                  cx="56"
                  cy="56"
                  r="40"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[#0e4324]">{score}</span>
                <span className={`text-xs font-medium ${statusColor}`}>{status}</span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{m.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-[#0e4324]">
                      {m.value.toFixed(0)}{m.unit}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        m.status === 'good'
                          ? 'bg-green-500'
                          : m.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-700 ${
                      m.status === 'good'
                        ? 'bg-green-500'
                        : m.status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(m.value, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Alert Banner ────────────────────────────────────────────────────
function AlertBanner({
  type,
  message,
}: {
  type: 'warning' | 'danger' | 'critical'
  message: string
}) {
  const styles = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    critical: 'bg-red-100 border-red-300 text-red-900 font-medium',
  }
  const icons = { warning: '⚠️', danger: '🔴', critical: '🚨' }

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${styles[type]}`}>
      <span>{icons[type]}</span>
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ── Empty State ─────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-[#0e4324]/5 rounded-full flex items-center justify-center mb-4">
        <span className="text-4xl">📊</span>
      </div>
      <h3 className="text-lg font-semibold text-[#0e4324] mb-2">Ainda sem dados este mês</h3>
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        Começa a registar faturação para veres as tuas métricas e análises aqui.
      </p>
      <a
        href="/faturacao"
        className="inline-flex items-center gap-2 bg-[#0e4324] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3019] transition-colors text-sm"
      >
        Registar primeiro serviço →
      </a>
    </div>
  )
}

// ── Custom Tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name: string; color: string}>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-medium text-[#0e4324] mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────────
export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [faturacaoMes, setFaturacaoMes] = useState<FaturacaoRow[]>([])
  const [despesasMes, setDespesasMes] = useState<DespesaRow[]>([])
  const [servicos, setServicos] = useState<ServicoRow[]>([])
  const [custosFixos, setCustosFixos] = useState<CustoFixoRow[]>([])
  const [chartData, setChartData] = useState<MonthData[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Barbearia
    const { data: barb } = await supabase
      .from('barbearias')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!barb) { setLoading(false); return }
    setBarbearia(barb)
    const bid = barb.id

    // Mês atual
    const { start, end } = getMonthRange(0)

    // Faturação do mês (concluido)
    const { data: fat } = await supabase
      .from('faturacao')
      .select('id, valor, gorjeta, data_hora, servico_id, servicos(nome, tempo_minutos)')
      .eq('barbearia_id', bid)
      .eq('estado', 'concluido')
      .gte('data_hora', start.toISOString())
      .lte('data_hora', end.toISOString())

    setFaturacaoMes((fat as unknown as FaturacaoRow[]) ?? [])

    // Despesas do mês
    const { data: desp } = await supabase
      .from('despesas')
      .select('valor, data')
      .eq('barbearia_id', bid)
      .gte('data', start.toISOString().split('T')[0])
      .lte('data', end.toISOString().split('T')[0])

    setDespesasMes((desp as DespesaRow[]) ?? [])

    // Serviços
    const { data: serv } = await supabase
      .from('servicos')
      .select('*')
      .eq('barbearia_id', bid)
      .eq('ativo', true)

    setServicos((serv as ServicoRow[]) ?? [])

    // Custos fixos
    const { data: custos } = await supabase
      .from('custos_fixos')
      .select('valor, tipo')
      .eq('barbearia_id', bid)

    setCustosFixos((custos as CustoFixoRow[]) ?? [])

    // Chart: últimos 6 meses
    const monthPromises = Array.from({ length: 6 }, async (_, i) => {
      const monthsAgo = 5 - i
      const { start: s, end: e } = getMonthRange(monthsAgo)

      const { data: f } = await supabase
        .from('faturacao')
        .select('valor')
        .eq('barbearia_id', bid)
        .eq('estado', 'concluido')
        .gte('data_hora', s.toISOString())
        .lte('data_hora', e.toISOString())

      const { data: d } = await supabase
        .from('despesas')
        .select('valor')
        .eq('barbearia_id', bid)
        .gte('data', s.toISOString().split('T')[0])
        .lte('data', e.toISOString().split('T')[0])

      return {
        mes: monthLabel(monthsAgo),
        faturacao: (f ?? []).reduce((sum: number, r: { valor: number }) => sum + r.valor, 0),
        despesas: (d ?? []).reduce((sum: number, r: { valor: number }) => sum + r.valor, 0),
      }
    })

    setChartData(await Promise.all(monthPromises))
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Calculations ────────────────────────────────────────────────
  const faturacaoTotal = faturacaoMes.reduce((s, f) => s + f.valor + (f.gorjeta ?? 0), 0)
  const despesasTotal = despesasMes.reduce((s, d) => s + d.valor, 0)
  const resultadoLiquido = faturacaoTotal - despesasTotal
  const ticketMedio = faturacaoMes.length > 0 ? faturacaoMes.reduce((s, f) => s + f.valor, 0) / faturacaoMes.length : 0

  // Top servicos
  const servicoMap: Record<string, TopServico> = {}
  faturacaoMes.forEach((f) => {
    const nome = (f.servicos as { nome: string; tempo_minutos: number } | null)?.nome ?? 'Sem serviço'
    if (!servicoMap[nome]) servicoMap[nome] = { nome, volume: 0, total: 0 }
    servicoMap[nome].volume += 1
    servicoMap[nome].total += f.valor
  })
  const topServicos = Object.values(servicoMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  const maxTotal = topServicos[0]?.total ?? 1

  // Health score metrics
  const horaAbertura = barbearia?.hora_abertura ? parseInt(barbearia.hora_abertura.split(':')[0]) : 9
  const horaFecho = barbearia?.hora_fecho ? parseInt(barbearia.hora_fecho.split(':')[0]) : 19
  const horasPerDay = Math.max(horaFecho - horaAbertura, 1)
  const numBarbeiros = barbearia?.num_barbeiros ?? 1
  const diasTrabalho = barbearia?.dias_trabalho_mes ?? 22
  const capacidadeMinutos = numBarbeiros * diasTrabalho * horasPerDay * 60

  const minutosVendidos = faturacaoMes.reduce((s, f) => {
    return s + ((f.servicos as { nome: string; tempo_minutos: number } | null)?.tempo_minutos ?? 30)
  }, 0)

  const taxaOcupacao = capacidadeMinutos > 0 ? (minutosVendidos / capacidadeMinutos) * 100 : 0

  const custosFixosMensais = custosFixos.reduce((s, c) => s + c.valor, 0)
  const breakEvenDiario = diasTrabalho > 0 ? custosFixosMensais / diasTrabalho : 0

  const margensServicos = servicos
    .filter((s) => s.preco > 0)
    .map((s) => ((s.preco - s.custo_material) / s.preco) * 100)
  const margemMedia = margensServicos.length > 0
    ? margensServicos.reduce((a, b) => a + b, 0) / margensServicos.length
    : 0

  const ratioCustos = faturacaoTotal > 0 ? (despesasTotal / faturacaoTotal) * 100 : 0

  const getStatus = (value: number, goodMin: number, warnMin: number, inverted = false): 'good' | 'warning' | 'critical' => {
    if (inverted) {
      if (value <= goodMin) return 'good'
      if (value <= warnMin) return 'warning'
      return 'critical'
    }
    if (value >= goodMin) return 'good'
    if (value >= warnMin) return 'warning'
    return 'critical'
  }

  const healthMetrics: HealthMetric[] = [
    {
      label: 'Taxa de ocupação',
      value: taxaOcupacao,
      unit: '%',
      status: getStatus(taxaOcupacao, 70, 40),
      description: `${minutosVendidos}min vendidos de ${capacidadeMinutos}min disponíveis`,
    },
    {
      label: 'Margem média',
      value: margemMedia,
      unit: '%',
      status: getStatus(margemMedia, 60, 30),
      description: 'Média das margens dos teus serviços',
    },
    {
      label: 'Rácio de custos',
      value: ratioCustos,
      unit: '%',
      status: getStatus(ratioCustos, 30, 50, true),
      description: `Despesas representam ${ratioCustos.toFixed(0)}% da faturação`,
    },
  ]

  const goodMetrics = healthMetrics.filter((m) => m.status === 'good').length
  const warnMetrics = healthMetrics.filter((m) => m.status === 'warning').length
  const healthScore = Math.round(
    (goodMetrics * 33 + warnMetrics * 16 + (resultadoLiquido >= 0 ? 1 : 0) * 10) *
      (faturacaoMes.length > 0 ? 1 : 0.3)
  )

  const hasData = faturacaoMes.length > 0

  // Smart alerts
  const alerts: Array<{ type: 'warning' | 'danger' | 'critical'; message: string }> = []
  if (hasData && taxaOcupacao < 60) {
    alerts.push({
      type: 'warning',
      message: `Taxa de ocupação de ${taxaOcupacao.toFixed(0)}% — considera promover os teus serviços ou otimizar horários para aumentar o fluxo de clientes.`,
    })
  }
  if (hasData && ratioCustos > 40) {
    alerts.push({
      type: 'danger',
      message: `As tuas despesas representam ${ratioCustos.toFixed(0)}% da faturação — revê os custos fixos e variáveis para melhorar a margem.`,
    })
  }
  if (hasData && resultadoLiquido < 0) {
    alerts.push({
      type: 'critical',
      message: `Resultado líquido negativo de ${fmt(resultadoLiquido)} este mês — a barbearia está a operar com prejuízo. Ação imediata recomendada.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0e4324]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
          {barbearia ? ` · ${barbearia.nome}` : ''}
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <AlertBanner key={i} type={a.type} message={a.message} />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Faturação do mês"
          value={fmt(faturacaoTotal)}
          icon="💰"
          color="bg-green-100 text-green-700"
          loading={loading}
          sub={faturacaoMes.length > 0 ? `${faturacaoMes.length} serviços` : undefined}
        />
        <KpiCard
          label="Despesas totais"
          value={fmt(despesasTotal)}
          icon="💳"
          color="bg-red-100 text-red-700"
          loading={loading}
          sub={despesasMes.length > 0 ? `${despesasMes.length} registos` : undefined}
        />
        <KpiCard
          label="Resultado líquido"
          value={fmt(resultadoLiquido)}
          icon={resultadoLiquido >= 0 ? '📈' : '📉'}
          color={resultadoLiquido >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
          loading={loading}
          sub={resultadoLiquido >= 0 ? 'Lucro' : 'Prejuízo'}
        />
        <KpiCard
          label="Ticket médio"
          value={fmt(ticketMedio)}
          icon="🎫"
          color="bg-[#977c30]/10 text-[#977c30]"
          loading={loading}
        />
      </div>

      {/* Chart + Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Faturação vs Despesas — últimos 6 meses</h3>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-xs text-gray-500">{value}</span>}
                />
                <Bar dataKey="faturacao" name="Faturação" fill="#0e4324" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#977c30" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Health Score */}
        <HealthScoreCard score={healthScore} metrics={healthMetrics} loading={loading} />
      </div>

      {/* Top Services */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Serviços mais faturados — este mês</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : topServicos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {topServicos.map((s, i) => (
              <div key={s.nome} className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#0e4324] truncate">{s.nome}</span>
                    <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{s.volume}×</span>
                      <span className="text-sm font-semibold text-[#0e4324]">{fmt(s.total)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-[#0e4324] h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${(s.total / maxTotal) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Break-even info */}
      {!loading && barbearia && custosFixosMensais > 0 && (
        <div className="bg-[#0e4324]/5 border border-[#0e4324]/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-3xl">🎯</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#0e4324]">Break-even diário</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Precisas de faturar <strong>{fmt(breakEvenDiario)}</strong> por dia de trabalho para cobrir os teus custos fixos mensais de <strong>{fmt(custosFixosMensais)}</strong>.
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-2xl font-bold text-[#0e4324]">{fmt(breakEvenDiario)}</span>
            <span className="text-xs text-gray-400 block text-right">/dia</span>
          </div>
        </div>
      )}
    </div>
  )
}
