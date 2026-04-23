'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getNichoConfig } from '@/lib/nicho'
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
  return <div className={`animate-pulse bg-surface-secondary rounded-lg ${className}`} />
}

// ── Custom Tooltip ──────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload) return null
  return (
    <div
      className="bg-white rounded-lg p-3 text-sm"
      style={{ border: '0.5px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
    >
      <p className="font-medium text-ink mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-ink-secondary" style={{ color: p.color }}>
          {p.name}: <span className="font-medium text-ink">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

// ── Empty State ─────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'rgba(14,67,36,0.06)' }}
      >
        <span
          className="material-symbols-outlined text-verde"
          style={{ fontSize: '28px' }}
        >
          bar_chart
        </span>
      </div>
      <h3 className="font-serif font-semibold text-xl text-ink mb-1">Ainda sem dados este mês</h3>
      <p className="text-sm text-ink-secondary max-w-xs mb-6">
        Começa a registar faturação para veres as tuas métricas e análises aqui.
      </p>
      <Link href="/faturacao" className="btn-primary">
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
        Registar primeiro serviço
      </Link>
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────────
export default function DashboardPage() {
  const supabase = createClient()
  const nicho = getNichoConfig()
  const [loading, setLoading] = useState(true)
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [faturacaoMes, setFaturacaoMes] = useState<FaturacaoRow[]>([])
  const [despesasMes, setDespesasMes] = useState<DespesaRow[]>([])
  const [servicos, setServicos] = useState<ServicoRow[]>([])
  const [custosFixos, setCustosFixos] = useState<CustoFixoRow[]>([])
  const [chartData, setChartData] = useState<MonthData[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Barbearia
    const { data: barb } = await supabase
      .from('barbearias')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!barb) {
      setLoading(false)
      return
    }
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
  const ticketMedio =
    faturacaoMes.length > 0
      ? faturacaoMes.reduce((s, f) => s + f.valor, 0) / faturacaoMes.length
      : 0

  // Top servicos
  const servicoMap: Record<string, TopServico> = {}
  faturacaoMes.forEach((f) => {
    const nome =
      (f.servicos as { nome: string; tempo_minutos: number } | null)?.nome ?? 'Sem serviço'
    if (!servicoMap[nome]) servicoMap[nome] = { nome, volume: 0, total: 0 }
    servicoMap[nome].volume += 1
    servicoMap[nome].total += f.valor
  })
  const topServicos = Object.values(servicoMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  const maxTotal = topServicos[0]?.total ?? 1

  // Health score metrics
  const horaAbertura = barbearia?.hora_abertura
    ? parseInt(barbearia.hora_abertura.split(':')[0])
    : 9
  const horaFecho = barbearia?.hora_fecho
    ? parseInt(barbearia.hora_fecho.split(':')[0])
    : 19
  const horasPerDay = Math.max(horaFecho - horaAbertura, 1)
  const numBarbeiros = barbearia?.num_barbeiros ?? 1
  const diasTrabalho = barbearia?.dias_trabalho_mes ?? 22
  const capacidadeMinutos = numBarbeiros * diasTrabalho * horasPerDay * 60

  const minutosVendidos = faturacaoMes.reduce((s, f) => {
    return (
      s +
      ((f.servicos as { nome: string; tempo_minutos: number } | null)?.tempo_minutos ?? 30)
    )
  }, 0)

  const taxaOcupacao =
    capacidadeMinutos > 0 ? (minutosVendidos / capacidadeMinutos) * 100 : 0

  const custosFixosMensais = custosFixos.reduce((s, c) => s + c.valor, 0)
  const breakEvenDiario = diasTrabalho > 0 ? custosFixosMensais / diasTrabalho : 0

  const margensServicos = servicos
    .filter((s) => s.preco > 0)
    .map((s) => ((s.preco - s.custo_material) / s.preco) * 100)
  const margemMedia =
    margensServicos.length > 0
      ? margensServicos.reduce((a, b) => a + b, 0) / margensServicos.length
      : 0

  const ratioCustos = faturacaoTotal > 0 ? (despesasTotal / faturacaoTotal) * 100 : 0

  const getStatus = (
    value: number,
    goodMin: number,
    warnMin: number,
    inverted = false
  ): 'good' | 'warning' | 'critical' => {
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
      message: `Resultado líquido negativo de ${fmt(resultadoLiquido)} este mês — o teu ${nicho.nomeNegocio} está a operar com prejuízo. Ação imediata recomendada.`,
    })
  }

  // Current date string
  const currentDateString = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const currentMonthString = new Date().toLocaleDateString('pt-PT', {
    month: 'long',
    year: 'numeric',
  })

  // Health score badge + ring color
  const healthLabel =
    healthScore >= 80 ? 'Excelente' : healthScore >= 60 ? 'Bom' : 'Atenção'
  const healthBadgeClass =
    healthScore >= 80 ? 'badge-green' : healthScore >= 60 ? 'badge-amber' : 'badge-red'
  const healthRingColor =
    healthScore >= 80
      ? '#16a34a'
      : healthScore >= 60
      ? '#977c30'
      : healthScore >= 40
      ? '#f97316'
      : '#dc2626'
  const circumference = 2 * Math.PI * 40
  const ringOffset = circumference - (healthScore / 100) * circumference

  return (
    <div className="page-container">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Visão geral</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            {currentDateString}
            {barbearia ? ` — ${barbearia.nome}` : ''}
          </p>
        </div>
        <Link href="/faturacao" className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add
          </span>
          Novo registo
        </Link>
      </div>

      {/* ── Alerts ──────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => {
            const isOccupancy = a.message.includes('ocupação')
            const isCosts = a.message.includes('despesas')
            const isLoss = a.message.includes('negativo')
            const iconName = isLoss ? 'crisis_alert' : isCosts ? 'trending_down' : 'warning'
            const borderColor = isLoss ? '#dc2626' : isCosts ? '#f97316' : '#f59e0b'
            const bgColor = isLoss ? '#fff5f5' : isCosts ? '#fff7ed' : '#fffbf0'
            const iconColor = isLoss ? '#dc2626' : isCosts ? '#f97316' : '#f59e0b'
            return (
              <div
                key={i}
                className="rounded-xl p-4 flex gap-3"
                style={{ background: bgColor, borderLeft: `3px solid ${borderColor}` }}
              >
                <span
                  className="material-symbols-outlined icon-filled flex-shrink-0 mt-0.5"
                  style={{ fontSize: '20px', color: iconColor }}
                >
                  {iconName}
                </span>
                <p className="text-sm text-ink">{a.message}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturação do mês */}
        <div className="metric-card metric-card-accent">
          <p className="metric-label">Faturação do mês</p>
          {loading ? (
            <>
              <Skeleton className="h-9 w-28 mt-2 mb-1" />
              <Skeleton className="h-3 w-20 mt-2" />
            </>
          ) : (
            <>
              <p className="metric-value mt-2">{fmt(faturacaoTotal)}</p>
              <p className="text-xs text-ink-secondary mt-2 flex items-center gap-1">
                <span
                  className="material-symbols-outlined icon-filled"
                  style={{ fontSize: '14px', color: '#0e4324' }}
                >
                  check_circle
                </span>
                {faturacaoMes.length} serviços concluídos
              </p>
            </>
          )}
        </div>

        {/* Despesas */}
        <div className="metric-card">
          <p className="metric-label">Despesas totais</p>
          {loading ? (
            <>
              <Skeleton className="h-9 w-28 mt-2 mb-1" />
              <Skeleton className="h-3 w-20 mt-2" />
            </>
          ) : (
            <>
              <p className="metric-value mt-2">{fmt(despesasTotal)}</p>
              <p className="text-xs text-ink-secondary mt-2 flex items-center gap-1">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '14px', color: '#717971' }}
                >
                  receipt_long
                </span>
                {despesasMes.length} registos
              </p>
            </>
          )}
        </div>

        {/* Resultado líquido */}
        <div className="metric-card">
          <p className="metric-label">Resultado líquido</p>
          {loading ? (
            <>
              <Skeleton className="h-9 w-28 mt-2 mb-1" />
              <Skeleton className="h-3 w-20 mt-2" />
            </>
          ) : (
            <>
              <p
                className="metric-value mt-2"
                style={{ color: resultadoLiquido >= 0 ? '#0e4324' : '#dc2626' }}
              >
                {fmt(resultadoLiquido)}
              </p>
              <p className="text-xs mt-2 flex items-center gap-1"
                style={{ color: resultadoLiquido >= 0 ? '#0e4324' : '#dc2626' }}>
                <span
                  className="material-symbols-outlined icon-filled"
                  style={{ fontSize: '14px' }}
                >
                  {resultadoLiquido >= 0 ? 'trending_up' : 'trending_down'}
                </span>
                {resultadoLiquido >= 0 ? 'Lucro' : 'Prejuízo'} este mês
              </p>
            </>
          )}
        </div>

        {/* Ticket médio */}
        <div className="metric-card">
          <p className="metric-label">Ticket médio</p>
          {loading ? (
            <>
              <Skeleton className="h-9 w-28 mt-2 mb-1" />
              <Skeleton className="h-3 w-20 mt-2" />
            </>
          ) : (
            <>
              <p className="metric-value mt-2">{fmt(ticketMedio)}</p>
              <p className="text-xs text-ink-secondary mt-2 flex items-center gap-1">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '14px', color: '#977c30' }}
                >
                  payments
                </span>
                Por serviço
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Chart + Health Score ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Faturação vs Despesas</h2>
            <span className="text-xs text-ink-secondary">{currentMonthString.replace(/^./, c => c.toUpperCase())} — últimos 6 meses</span>
          </div>
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="32%">
                <CartesianGrid
                  strokeDasharray="0"
                  stroke="#f0eee8"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#717971', fontFamily: 'Inter, system-ui, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#717971', fontFamily: 'Inter, system-ui, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `€${v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Legend
                  formatter={(value) => (
                    <span style={{ fontSize: '11px', color: '#717971', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {value}
                    </span>
                  )}
                />
                <Bar
                  dataKey="faturacao"
                  name="Faturação"
                  fill="#0e4324"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="despesas"
                  name="Despesas"
                  fill="#977c30"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Health Score */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Health Score</h2>
            {!loading && (
              <span className={healthBadgeClass}>{healthLabel}</span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="w-28 h-28 rounded-full" />
              <div className="w-full space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            </div>
          ) : (
            <>
              {/* Ring */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <svg width="112" height="112" className="-rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="40"
                      fill="none"
                      stroke="#f0eee8"
                      strokeWidth="10"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="40"
                      fill="none"
                      stroke={healthRingColor}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-serif font-bold text-2xl text-ink leading-none">
                      {healthScore}
                    </span>
                    <span className="text-xs text-ink-secondary mt-0.5">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Metric breakdown */}
              <div className="space-y-4">
                {healthMetrics.map((m) => {
                  const statusColor =
                    m.status === 'good'
                      ? '#16a34a'
                      : m.status === 'warning'
                      ? '#d97706'
                      : '#dc2626'
                  const barBg =
                    m.status === 'good'
                      ? '#16a34a'
                      : m.status === 'warning'
                      ? '#f59e0b'
                      : '#dc2626'
                  return (
                    <div key={m.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-ink-secondary">{m.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-medium"
                            style={{ color: statusColor }}
                          >
                            {m.value.toFixed(0)}{m.unit}
                          </span>
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: statusColor }}
                          />
                        </div>
                      </div>
                      <div
                        className="w-full rounded-full h-1"
                        style={{ background: '#f0eee8' }}
                      >
                        <div
                          className="h-1 rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(m.value, 100)}%`,
                            background: barBg,
                          }}
                        />
                      </div>
                      <p className="text-xs text-ink-tertiary mt-0.5">{m.description}</p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Top Services ────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Serviços mais faturados</h2>
          <span className="text-xs text-ink-secondary">Este mês</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : topServicos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {topServicos.map((s, i) => (
              <div key={s.nome} className="flex items-center gap-4">
                <span
                  className="font-serif font-bold text-sm w-5 text-center flex-shrink-0"
                  style={{ color: i === 0 ? '#977c30' : '#a8a89f' }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-ink font-medium truncate">{s.nome}</span>
                    <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                      <span className="text-xs text-ink-tertiary">{s.volume}×</span>
                      <span className="font-serif font-medium text-sm text-ink">
                        {fmt(s.total)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-full rounded-full h-1"
                    style={{ background: '#f0eee8' }}
                  >
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{
                        width: `${(s.total / maxTotal) * 100}%`,
                        background: i === 0 ? '#977c30' : '#0e4324',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Break-even Info ──────────────────────────────────────── */}
      {!loading && barbearia && custosFixosMensais > 0 && (
        <div
          className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{
            background: 'rgba(14,67,36,0.04)',
            border: '0.5px solid rgba(14,67,36,0.12)',
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(14,67,36,0.08)' }}
          >
            <span
              className="material-symbols-outlined text-verde"
              style={{ fontSize: '20px' }}
            >
              target
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">Break-even diário</p>
            <p className="text-xs text-ink-secondary mt-0.5">
              Precisas de faturar{' '}
              <strong className="text-ink">{fmt(breakEvenDiario)}</strong> por dia de
              trabalho para cobrir os teus custos fixos mensais de{' '}
              <strong className="text-ink">{fmt(custosFixosMensais)}</strong>.
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="font-serif font-bold text-2xl text-verde leading-none">
              {fmt(breakEvenDiario)}
            </p>
            <p className="text-xs text-ink-tertiary mt-0.5">por dia</p>
          </div>
        </div>
      )}

      {/* ── Suggestions ─────────────────────────────────────────── */}
      {!loading && hasData && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="material-symbols-outlined icon-filled"
              style={{ fontSize: '20px', color: '#977c30' }}
            >
              lightbulb
            </span>
            <h2 className="section-title">Sugestões</h2>
          </div>
          <div className="space-y-3">
            {taxaOcupacao < 70 && (
              <div
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: '#f9f7f2' }}
              >
                <span
                  className="material-symbols-outlined flex-shrink-0 mt-0.5"
                  style={{ fontSize: '18px', color: '#0e4324' }}
                >
                  schedule
                </span>
                <p className="text-sm text-ink-secondary">
                  A tua taxa de ocupação está em{' '}
                  <strong className="text-ink">{taxaOcupacao.toFixed(0)}%</strong>. Considera
                  promoções em horários de menor procura para maximizar a capacidade disponível.
                </p>
              </div>
            )}
            {margemMedia < 60 && servicos.length > 0 && (
              <div
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: '#f9f7f2' }}
              >
                <span
                  className="material-symbols-outlined flex-shrink-0 mt-0.5"
                  style={{ fontSize: '18px', color: '#977c30' }}
                >
                  trending_up
                </span>
                <p className="text-sm text-ink-secondary">
                  A margem média dos teus serviços é de{' '}
                  <strong className="text-ink">{margemMedia.toFixed(0)}%</strong>. Revê os
                  preços ou reduz os custos de material para melhorar a rentabilidade.
                </p>
              </div>
            )}
            {resultadoLiquido > 0 && taxaOcupacao >= 70 && margemMedia >= 60 && (
              <div
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: 'rgba(14,67,36,0.04)' }}
              >
                <span
                  className="material-symbols-outlined icon-filled flex-shrink-0 mt-0.5"
                  style={{ fontSize: '18px', color: '#16a34a' }}
                >
                  check_circle
                </span>
                <p className="text-sm text-ink-secondary">
                  O teu {nicho.nomeNegocio} está a operar de forma saudável. Mantém o ritmo e considera
                  reinvestir os lucros para continuar a crescer.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
