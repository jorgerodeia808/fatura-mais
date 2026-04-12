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
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Barbearia {
  id: string
  nome: string
}

interface FaturacaoRow {
  id: string
  barbearia_id: string
  valor: number
  gorjeta: number
  estado: string
  data_hora: string
  servico_id: string | null
  servicos?: { nome: string; tempo_minutos: number } | null
}

interface DespesaRow {
  id: string
  barbearia_id: string
  descricao: string
  valor: number
  categoria: string
  tipo: string
  data: string
}

interface MarcacaoRow {
  id: string
  barbearia_id: string
  estado: string
  data_hora: string
  sms_enviado: boolean
}

interface ServicoRow {
  id: string
  barbearia_id: string
  nome: string
  preco: number
  tempo_minutos: number
}

interface MonthlyData {
  mes: string
  mesLabel: string
  faturacao: number
  despesas: number
  resultado: number
  margem: number
}

interface ServicoAnalise {
  id: string
  nome: string
  realizacoes: number
  faturacaoTotal: number
  faturacaoMedia: number
  tempoTotal: number
}

type Periodo = 'este-mes' | 'mes-anterior' | '3-meses' | '6-meses' | 'este-ano' | 'personalizado'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

function getPeriodDates(periodo: Periodo, customFrom: string, customTo: string): { from: Date; to: Date } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  switch (periodo) {
    case 'este-mes':
      return { from: new Date(year, month, 1), to: new Date(year, month + 1, 0, 23, 59, 59) }
    case 'mes-anterior':
      return { from: new Date(year, month - 1, 1), to: new Date(year, month, 0, 23, 59, 59) }
    case '3-meses':
      return { from: new Date(year, month - 2, 1), to: new Date(year, month + 1, 0, 23, 59, 59) }
    case '6-meses':
      return { from: new Date(year, month - 5, 1), to: new Date(year, month + 1, 0, 23, 59, 59) }
    case 'este-ano':
      return { from: new Date(year, 0, 1), to: new Date(year, 11, 31, 23, 59, 59) }
    case 'personalizado':
      return {
        from: customFrom ? new Date(customFrom) : new Date(year, month, 1),
        to: customTo ? new Date(customTo + 'T23:59:59') : new Date(year, month + 1, 0, 23, 59, 59),
      }
  }
}

function getPrevPeriodDates(periodo: Periodo, customFrom: string, customTo: string): { from: Date; to: Date } {
  const { from, to } = getPeriodDates(periodo, customFrom, customTo)
  const diffMs = to.getTime() - from.getTime()
  return {
    from: new Date(from.getTime() - diffMs - 1),
    to: new Date(from.getTime() - 1),
  }
}

function mesLabel(dateStr: string) {
  const d = new Date(dateStr + '-01')
  return d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' })
}

function getMonthsInRange(from: Date, to: Date): string[] {
  const months: string[] = []
  const cur = new Date(from.getFullYear(), from.getMonth(), 1)
  const end = new Date(to.getFullYear(), to.getMonth(), 1)
  while (cur <= end) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

// ── Trend badge ────────────────────────────────────────────────────────────────

function Trend({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-xs text-gray-400">—</span>
  const up = value > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      )}
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}

// ── Summary card ───────────────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string
  value: string
  trend: number
  loading: boolean
  icon: React.ReactNode
  accent?: boolean
}

function SummaryCard({ title, value, trend, loading, icon, accent }: SummaryCardProps) {
  return (
    <div className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 ${accent ? 'border-[#0e4324]/20' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <span className="text-[#0e4324] opacity-70">{icon}</span>
      </div>
      {loading ? (
        <>
          <Sk className="h-8 w-32" />
          <Sk className="h-4 w-20" />
        </>
      ) : (
        <>
          <p className={`text-2xl font-bold ${accent ? 'text-[#0e4324]' : 'text-gray-800'}`}>{value}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Trend value={trend} />
            <span>vs período anterior</span>
          </div>
        </>
      )}
    </div>
  )
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <h2 className="text-base font-bold text-[#0e4324]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="py-12 text-center text-gray-400 text-sm">{msg}</div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const supabase = createClient()

  // ── State ──────────────────────────────────────────────────────────
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [periodo, setPeriodo] = useState<Periodo>('este-mes')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Data
  const [faturacaoRows, setFaturacaoRows] = useState<FaturacaoRow[]>([])
  const [faturacaoPrev, setFaturacaoPrev] = useState<FaturacaoRow[]>([])
  const [despesaRows, setDespesaRows] = useState<DespesaRow[]>([])
  const [despesasPrev, setDespesasPrev] = useState<DespesaRow[]>([])
  const [marcacaoRows, setMarcacaoRows] = useState<MarcacaoRow[]>([])
  const [servicoRows, setServicoRows] = useState<ServicoRow[]>([])

  // ── Load barbearia ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('barbearias')
        .select('id, nome')
        .eq('user_id', user.id)
        .single()
      if (data) setBarbearia(data as unknown as Barbearia)
    }
    load()
  }, [supabase])

  // ── Fetch data ─────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!barbearia) return
    setLoading(true)

    const { from, to } = getPeriodDates(periodo, customFrom, customTo)
    const { from: pfrom, to: pto } = getPrevPeriodDates(periodo, customFrom, customTo)

    const fromISO = from.toISOString()
    const toISO = to.toISOString()
    const pfromISO = pfrom.toISOString()
    const ptoISO = pto.toISOString()

    const [fatRes, fatPrevRes, despRes, despPrevRes, marcRes, svcRes] = await Promise.all([
      supabase
        .from('faturacao')
        .select('id, barbearia_id, valor, gorjeta, estado, data_hora, servico_id, servicos(nome, tempo_minutos)')
        .eq('barbearia_id', barbearia.id)
        .gte('data_hora', fromISO)
        .lte('data_hora', toISO),
      supabase
        .from('faturacao')
        .select('id, barbearia_id, valor, gorjeta, estado, data_hora, servico_id')
        .eq('barbearia_id', barbearia.id)
        .gte('data_hora', pfromISO)
        .lte('data_hora', ptoISO),
      supabase
        .from('despesas')
        .select('id, barbearia_id, descricao, valor, categoria, tipo, data')
        .eq('barbearia_id', barbearia.id)
        .gte('data', from.toISOString().slice(0, 10))
        .lte('data', to.toISOString().slice(0, 10)),
      supabase
        .from('despesas')
        .select('id, barbearia_id, descricao, valor, categoria, tipo, data')
        .eq('barbearia_id', barbearia.id)
        .gte('data', pfrom.toISOString().slice(0, 10))
        .lte('data', pto.toISOString().slice(0, 10)),
      supabase
        .from('marcacoes')
        .select('id, barbearia_id, estado, data_hora, sms_enviado')
        .eq('barbearia_id', barbearia.id)
        .gte('data_hora', fromISO)
        .lte('data_hora', toISO),
      supabase
        .from('servicos')
        .select('id, barbearia_id, nome, preco, tempo_minutos')
        .eq('barbearia_id', barbearia.id),
    ])

    setFaturacaoRows((fatRes.data ?? []) as unknown as FaturacaoRow[])
    setFaturacaoPrev((fatPrevRes.data ?? []) as unknown as FaturacaoRow[])
    setDespesaRows((despRes.data ?? []) as unknown as DespesaRow[])
    setDespesasPrev((despPrevRes.data ?? []) as unknown as DespesaRow[])
    setMarcacaoRows((marcRes.data ?? []) as unknown as MarcacaoRow[])
    setServicoRows((svcRes.data ?? []) as unknown as ServicoRow[])

    setLoading(false)
  }, [barbearia, periodo, customFrom, customTo, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Derived metrics ────────────────────────────────────────────────

  const totalFaturacao = faturacaoRows.reduce((s, r) => s + (r.valor ?? 0), 0)
  const totalFaturacaoPrev = faturacaoPrev.reduce((s, r) => s + (r.valor ?? 0), 0)
  const totalDespesas = despesaRows.reduce((s, r) => s + (r.valor ?? 0), 0)
  const totalDespesasPrev = despesasPrev.reduce((s, r) => s + (r.valor ?? 0), 0)
  const resultado = totalFaturacao - totalDespesas
  const resultadoPrev = totalFaturacaoPrev - totalDespesasPrev
  const margem = totalFaturacao > 0 ? (resultado / totalFaturacao) * 100 : 0
  const margemPrev = totalFaturacaoPrev > 0 ? (resultadoPrev / totalFaturacaoPrev) * 100 : 0

  const trendFat = totalFaturacaoPrev > 0 ? ((totalFaturacao - totalFaturacaoPrev) / totalFaturacaoPrev) * 100 : 0
  const trendDesp = totalDespesasPrev > 0 ? ((totalDespesas - totalDespesasPrev) / totalDespesasPrev) * 100 : 0
  const trendRes = resultadoPrev !== 0 ? ((resultado - resultadoPrev) / Math.abs(resultadoPrev)) * 100 : 0
  const trendMarg = margem - margemPrev

  // ── Monthly chart data ─────────────────────────────────────────────

  const monthlyData: MonthlyData[] = (() => {
    const { from, to } = getPeriodDates(periodo, customFrom, customTo)
    const months = getMonthsInRange(from, to)

    return months.map((mes) => {
      const fat = faturacaoRows
        .filter((r) => r.data_hora.startsWith(mes))
        .reduce((s, r) => s + r.valor, 0)
      const desp = despesaRows
        .filter((r) => r.data.startsWith(mes))
        .reduce((s, r) => s + r.valor, 0)
      const res = fat - desp
      const marg = fat > 0 ? (res / fat) * 100 : 0
      return { mes, mesLabel: mesLabel(mes), faturacao: fat, despesas: desp, resultado: res, margem: marg }
    })
  })()

  // ── Services analysis ──────────────────────────────────────────────

  const servicosAnalise: ServicoAnalise[] = (() => {
    const map = new Map<string, ServicoAnalise>()

    for (const row of faturacaoRows) {
      if (!row.servico_id) continue
      const svc = servicoRows.find((s) => s.id === row.servico_id)
      const nome = (row.servicos?.nome ?? svc?.nome) || 'Sem serviço'
      const tempo = row.servicos?.tempo_minutos ?? svc?.tempo_minutos ?? 0

      if (!map.has(row.servico_id)) {
        map.set(row.servico_id, {
          id: row.servico_id,
          nome,
          realizacoes: 0,
          faturacaoTotal: 0,
          faturacaoMedia: 0,
          tempoTotal: 0,
        })
      }
      const entry = map.get(row.servico_id)!
      entry.realizacoes++
      entry.faturacaoTotal += row.valor
      entry.tempoTotal += tempo
    }

    return Array.from(map.values())
      .map((e) => ({ ...e, faturacaoMedia: e.realizacoes > 0 ? e.faturacaoTotal / e.realizacoes : 0 }))
      .sort((a, b) => b.faturacaoTotal - a.faturacaoTotal)
  })()

  // ── Gorjetas ───────────────────────────────────────────────────────

  const totalGorjetas = faturacaoRows.reduce((s, r) => s + (r.gorjeta ?? 0), 0)
  const mediaGorjeta = faturacaoRows.length > 0 ? totalGorjetas / faturacaoRows.length : 0
  const maxGorjeta = Math.max(...faturacaoRows.map((r) => r.gorjeta ?? 0), 1)

  // ── Marcações ──────────────────────────────────────────────────────

  const totalMarcacoes = marcacaoRows.length
  const confirmadas = marcacaoRows.filter((m) => m.estado === 'confirmado' || m.estado === 'concluido').length
  const desistencias = marcacaoRows.filter((m) => m.estado === 'desistencia' || m.estado === 'cancelado').length
  const taxaDesistencia = totalMarcacoes > 0 ? (desistencias / totalMarcacoes) * 100 : 0

  const pieMarc = [
    { name: 'Confirmadas', value: confirmadas },
    { name: 'Desistências', value: desistencias },
  ]

  // ── Despesas por categoria ─────────────────────────────────────────

  const despCat = (() => {
    const map = new Map<string, number>()
    for (const d of despesaRows) {
      map.set(d.categoria, (map.get(d.categoria) ?? 0) + d.valor)
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  })()

  const despFixas = despesaRows.filter((d) => d.tipo === 'fixo').reduce((s, d) => s + d.valor, 0)
  const despVariaveis = despesaRows.filter((d) => d.tipo === 'variavel').reduce((s, d) => s + d.valor, 0)
  const pctFixas = totalDespesas > 0 ? (despFixas / totalDespesas) * 100 : 0
  const pctVariaveis = totalDespesas > 0 ? (despVariaveis / totalDespesas) * 100 : 0

  const PIE_COLORS = ['#0e4324', '#977c30', '#16a34a', '#ef4444', '#3b82f6', '#a855f7', '#f97316', '#06b6d4']

  // ── Period label ───────────────────────────────────────────────────

  const periodoLabel = (() => {
    const { from, to } = getPeriodDates(periodo, customFrom, customTo)
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }
    return `${from.toLocaleDateString('pt-PT', opts)} – ${to.toLocaleDateString('pt-PT', opts)}`
  })()

  // ── PDF Export ─────────────────────────────────────────────────────

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const el = document.getElementById('relatorio-pdf')
      if (!el) return

      const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: '#f7f5f0' })
      const imgData = canvas.toDataURL('image/jpeg', 0.92)

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 12
      const contentW = pageW - margin * 2

      // Header background
      pdf.setFillColor(14, 67, 36)
      pdf.rect(0, 0, pageW, 36, 'F')

      // Logo
      try {
        const logoResp = await fetch('/images/Logo_F_.png')
        const blob = await logoResp.blob()
        const reader = new FileReader()
        await new Promise<void>((res) => {
          reader.onload = () => {
            pdf.addImage(reader.result as string, 'PNG', margin, 6, 24, 24)
            res()
          }
          reader.readAsDataURL(blob)
        })
      } catch {
        // logo not available – skip
      }

      // Header text
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text(barbearia?.nome ?? 'Fatura+', margin + 28, 18)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Relatório • ${periodoLabel}`, margin + 28, 26)

      // Body image
      const imgH = (canvas.height * contentW) / canvas.width
      const maxImgH = pageH - 36 - 16 - 14 // header + top-margin + footer
      const usedH = Math.min(imgH, maxImgH)
      pdf.addImage(imgData, 'JPEG', margin, 40, contentW, usedH)

      // Footer
      pdf.setFontSize(7)
      pdf.setTextColor(150, 150, 150)
      pdf.text('Gerado por Fatura+ — fatura-mais.pt', pageW / 2, pageH - 6, { align: 'center' })

      pdf.save(`relatorio-${barbearia?.nome ?? 'barbearia'}-${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10" style={{ background: '#f7f5f0', minHeight: '100vh' }}>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0e4324]">Relatórios</h1>
          <p className="text-gray-500 text-sm mt-0.5">Análises e estatísticas detalhadas</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exporting || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: '#977c30', minHeight: 44 }}
        >
          {exporting ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
            </svg>
          )}
          Exportar PDF
        </button>
      </div>

      {/* Period filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'este-mes', label: 'Este mês' },
              { id: 'mes-anterior', label: 'Mês anterior' },
              { id: '3-meses', label: 'Últimos 3 meses' },
              { id: '6-meses', label: 'Últimos 6 meses' },
              { id: 'este-ano', label: 'Este ano' },
              { id: 'personalizado', label: 'Personalizado' },
            ] as { id: Periodo; label: string }[]
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                minHeight: 44,
                fontSize: 16,
                background: periodo === p.id ? '#0e4324' : '#f3f4f6',
                color: periodo === p.id ? '#fff' : '#374151',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {periodo === 'personalizado' && (
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">De</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e4324]/30"
                style={{ minHeight: 44, fontSize: 16 }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Até</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e4324]/30"
                style={{ minHeight: 44, fontSize: 16 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Wrapper for PDF capture */}
      <div id="relatorio-pdf" className="space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            title="Faturação total"
            value={fmt(totalFaturacao)}
            trend={trendFat}
            loading={loading}
            accent
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <SummaryCard
            title="Despesas totais"
            value={fmt(totalDespesas)}
            trend={-trendDesp}
            loading={loading}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />
          <SummaryCard
            title="Resultado líquido"
            value={fmt(resultado)}
            trend={trendRes}
            loading={loading}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <SummaryCard
            title="Margem (%)"
            value={`${margem.toFixed(1)}%`}
            trend={trendMarg}
            loading={loading}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            }
          />
        </div>

        {/* Evolução mensal */}
        <Section title="Evolução Mensal">
          {loading ? (
            <Sk className="h-64 w-full" />
          ) : monthlyData.length === 0 ? (
            <EmptyState msg="Sem dados para o período selecionado." />
          ) : (
            <div className="space-y-6">
              {/* Bar + Line chart */}
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Faturação vs Despesas</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `${v}€`} width={54} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="faturacao" name="Faturação" fill="#0e4324" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="#977c30" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resultado líquido</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={monthlyData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `${v}€`} width={54} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="resultado" name="Resultado" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      <Line
                        type="monotone"
                        dataKey="resultado"
                        name="Tendência"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly table */}
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Mês</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Faturação</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Despesas</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Resultado</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Margem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthlyData.map((m) => (
                      <tr key={m.mes} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{m.mesLabel}</td>
                        <td className="px-4 py-3 text-right text-[#0e4324] font-medium">{fmt(m.faturacao)}</td>
                        <td className="px-4 py-3 text-right text-[#977c30]">{fmt(m.despesas)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${m.resultado >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {fmt(m.resultado)}
                        </td>
                        <td className={`px-4 py-3 text-right ${m.margem >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {m.margem.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-4 py-3 text-gray-800">Total</td>
                      <td className="px-4 py-3 text-right text-[#0e4324]">{fmt(totalFaturacao)}</td>
                      <td className="px-4 py-3 text-right text-[#977c30]">{fmt(totalDespesas)}</td>
                      <td className={`px-4 py-3 text-right ${resultado >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {fmt(resultado)}
                      </td>
                      <td className={`px-4 py-3 text-right ${margem >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {margem.toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </Section>

        {/* Análise de serviços */}
        <Section title="Análise de Serviços">
          {loading ? (
            <Sk className="h-64 w-full" />
          ) : servicosAnalise.length === 0 ? (
            <EmptyState msg="Sem serviços registados no período." />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Horizontal bar chart */}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top serviços por receita</p>
                  <ResponsiveContainer width="100%" height={Math.max(200, servicosAnalise.length * 44)}>
                    <BarChart
                      layout="vertical"
                      data={servicosAnalise.slice(0, 8)}
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `${v}€`} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: '#6b7280' }} width={110} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="faturacaoTotal" name="Faturação" fill="#0e4324" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Services table */}
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Serviço</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Realizações</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Faturação total</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Faturação média</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Tempo total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {servicosAnalise.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                          {s.nome}
                          {idx === 0 && (
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: '#977c3020', color: '#977c30' }}
                            >
                              ⭐ Mais rentável
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{s.realizacoes}</td>
                        <td className="px-4 py-3 text-right text-[#0e4324] font-medium">{fmt(s.faturacaoTotal)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmt(s.faturacaoMedia)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{s.tempoTotal} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Section>

        {/* Marcações */}
        <Section title="Marcações">
          {loading ? (
            <Sk className="h-48 w-full" />
          ) : totalMarcacoes === 0 ? (
            <EmptyState msg="Sem marcações no período." />
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              {/* Pie chart */}
              <div className="flex-shrink-0">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={pieMarc}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      <Cell fill="#0e4324" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium">Total marcações</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{totalMarcacoes}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-700 font-medium">Confirmadas</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{confirmadas}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs text-red-600 font-medium">Desistências</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{desistencias}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-xs text-orange-600 font-medium">Taxa desistência</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{taxaDesistencia.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Gorjetas */}
        <Section title="Gorjetas">
          {loading ? (
            <Sk className="h-32 w-full" />
          ) : totalGorjetas === 0 ? (
            <EmptyState msg="Sem gorjetas registadas no período." />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-[#0e4324]/5 rounded-xl p-4">
                  <p className="text-xs text-[#0e4324] font-medium">Total gorjetas</p>
                  <p className="text-2xl font-bold text-[#0e4324] mt-1">{fmt(totalGorjetas)}</p>
                </div>
                <div className="bg-[#977c30]/10 rounded-xl p-4">
                  <p className="text-xs text-[#977c30] font-medium">Média por serviço</p>
                  <p className="text-2xl font-bold text-[#977c30] mt-1">{fmt(mediaGorjeta)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-500 font-medium mb-2">Distribuição por serviço</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {faturacaoRows
                      .filter((r) => r.gorjeta > 0)
                      .sort((a, b) => b.gorjeta - a.gorjeta)
                      .slice(0, 10)
                      .map((r) => {
                        const pct = maxGorjeta > 0 ? (r.gorjeta / maxGorjeta) * 100 : 0
                        const nome = r.servicos?.nome ?? 'Serviço'
                        return (
                          <div key={r.id} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-20 truncate">{nome}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{ width: `${pct}%`, background: '#977c30' }}
                              />
                            </div>
                            <span className="text-xs font-medium text-[#977c30] w-14 text-right">{fmt(r.gorjeta)}</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Despesas detalhadas */}
        <Section title="Despesas Detalhadas">
          {loading ? (
            <Sk className="h-64 w-full" />
          ) : despesaRows.length === 0 ? (
            <EmptyState msg="Sem despesas no período." />
          ) : (
            <div className="space-y-6">
              {/* Fixas vs variáveis */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-medium">Fixas</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">{fmt(despFixas)}</p>
                  <p className="text-xs text-blue-500 mt-0.5">{pctFixas.toFixed(1)}% do total</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-xs text-purple-600 font-medium">Variáveis</p>
                  <p className="text-xl font-bold text-purple-700 mt-1">{fmt(despVariaveis)}</p>
                  <p className="text-xs text-purple-500 mt-0.5">{pctVariaveis.toFixed(1)}% do total</p>
                </div>
                <div className="col-span-2 bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium mb-2">Proporção</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 w-10">{pctFixas.toFixed(0)}%</span>
                    <div className="flex-1 h-4 bg-purple-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${pctFixas}%` }}
                      />
                    </div>
                    <span className="text-xs text-purple-600 w-10 text-right">{pctVariaveis.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Fixas</span>
                    <span>Variáveis</span>
                  </div>
                </div>
              </div>

              {/* Pie by categoria + table */}
              <div className="flex flex-col lg:flex-row gap-6">
                {despCat.length > 0 && (
                  <div className="flex-shrink-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Por categoria</p>
                    <ResponsiveContainer width={260} height={260}>
                      <PieChart>
                        <Pie
                          data={despCat}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          paddingAngle={2}
                          label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {despCat.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [fmt(Number(v)), '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Despesas table */}
                <div className="flex-1 overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Descrição</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoria</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Data</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {despesaRows
                        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                        .map((d) => (
                          <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-800">{d.descricao}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{d.categoria}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  d.tipo === 'fixo' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                {d.tipo === 'fixo' ? 'Fixa' : 'Variável'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {new Date(d.data).toLocaleDateString('pt-PT')}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-[#977c30]">{fmt(d.valor)}</td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan={4} className="px-4 py-3 text-gray-700">Total despesas</td>
                        <td className="px-4 py-3 text-right text-[#977c30]">{fmt(totalDespesas)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Section>

      </div>{/* end #relatorio-pdf */}
    </div>
  )
}
