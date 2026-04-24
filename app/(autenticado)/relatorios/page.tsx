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
import { getNichoConfig } from '@/lib/nicho'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Barbearia {
  id: string
  nome: string
  comissao_ativa: boolean | null
  comissao_percentagem: number | null
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
  return <div className={`animate-pulse bg-surface-secondary rounded-lg ${className}`} />
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="py-12 text-center text-ink-secondary text-sm font-sans">{msg}</div>
  )
}

// ── Tooltip ────────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '8px', fontSize: '12px', padding: '10px 14px' }}>
      <p className="font-semibold text-ink mb-1 font-sans">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-sans">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <h2 className="section-title mb-5 pb-4 border-b border-surface-secondary">{title}</h2>
      <div>{children}</div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const supabase = createClient()
  const nicho = getNichoConfig()

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
        .select('id, nome, comissao_ativa, comissao_percentagem')
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

  // ── Comissão ───────────────────────────────────────────────────
  const comissaoAtiva = barbearia?.comissao_ativa ?? false
  const comissaoPct = barbearia?.comissao_percentagem ?? 0
  const comissaoDevida = comissaoAtiva ? totalFaturacao * (comissaoPct / 100) : 0
  const resultadoRealComissao = resultado - comissaoDevida

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
    { name: 'Outras', value: Math.max(0, totalMarcacoes - confirmadas - desistencias) },
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

  const PIE_COLORS = ['rgb(var(--verde))', 'rgb(var(--dourado))', '#d4d0c8', '#16a34a', '#ef4444', '#3b82f6', '#a855f7', '#f97316']

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
      const maxImgH = pageH - 36 - 16 - 14
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

  // ── Chart shared styles ────────────────────────────────────────────

  const axisStyle = { fill: '#717971', fontSize: 11 }
  const gridStyle = { stroke: '#f0eee8' }
  const tooltipStyle = { contentStyle: { background: 'white', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '8px', fontSize: '12px' } }

  // ── Render ─────────────────────────────────────────────────────────

  const periods: { value: Periodo; label: string }[] = [
    { value: 'este-mes', label: 'Este mês' },
    { value: 'mes-anterior', label: 'Mês anterior' },
    { value: '3-meses', label: 'Últimos 3 meses' },
    { value: '6-meses', label: 'Últimos 6 meses' },
    { value: 'este-ano', label: 'Este ano' },
    { value: 'personalizado', label: 'Personalizado' },
  ]

  return (
    <div className="space-y-6 pb-10">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="text-ink-secondary text-sm mt-0.5 font-sans">Análises e estatísticas detalhadas</p>
        </div>
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={handleExportPDF}
          disabled={exporting || loading}
        >
          {exporting ? (
            <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span>
          )}
          Exportar PDF
        </button>
      </div>

      {/* Period filter */}
      <div className="card">
        <div className="inline-flex bg-surface-secondary rounded-xl p-1 gap-0.5 flex-wrap">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-all duration-150 ${
                periodo === p.value
                  ? 'bg-white text-verde shadow-sm border border-black/5'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {periodo === 'personalizado' && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-surface-secondary">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-secondary font-medium font-sans">De</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-secondary font-medium font-sans">Até</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        )}
      </div>

      {/* Wrapper for PDF capture */}
      <div id="relatorio-pdf" className="space-y-6">

        {/* Summary metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Faturação */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="metric-label">Faturação total</span>
              <span className="material-symbols-outlined text-verde/60" style={{ fontSize: '18px' }}>payments</span>
            </div>
            {loading ? <Sk className="h-8 w-32 mb-2" /> : (
              <p className="metric-value">{fmt(totalFaturacao)}</p>
            )}
            {!loading && (
              <span className={`badge ${trendFat > 0 ? 'badge-green' : trendFat < 0 ? 'badge-red' : 'badge-gray'}`}>
                {fmtPct(trendFat)} vs anterior
              </span>
            )}
          </div>

          {/* Despesas */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="metric-label">Despesas totais</span>
              <span className="material-symbols-outlined text-verde/60" style={{ fontSize: '18px' }}>credit_card</span>
            </div>
            {loading ? <Sk className="h-8 w-32 mb-2" /> : (
              <p className="metric-value">{fmt(totalDespesas)}</p>
            )}
            {!loading && (
              <span className={`badge ${trendDesp < 0 ? 'badge-green' : trendDesp > 0 ? 'badge-red' : 'badge-gray'}`}>
                {fmtPct(trendDesp)} vs anterior
              </span>
            )}
          </div>

          {/* Resultado */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="metric-label">
                {comissaoAtiva ? 'Resultado real' : 'Resultado líquido'}
              </span>
              <span className="material-symbols-outlined text-verde/60" style={{ fontSize: '18px' }}>bar_chart</span>
            </div>
            {loading ? <Sk className="h-8 w-32 mb-2" /> : (
              <>
                <p className="metric-value">{fmt(comissaoAtiva ? resultadoRealComissao : resultado)}</p>
                {comissaoAtiva && (
                  <p className="text-xs text-ink-secondary mt-0.5">após comissão de {comissaoPct}%</p>
                )}
              </>
            )}
            {!loading && (
              <span className={`badge ${trendRes > 0 ? 'badge-green' : trendRes < 0 ? 'badge-red' : 'badge-gray'}`}>
                {fmtPct(trendRes)} vs anterior
              </span>
            )}
          </div>

          {/* Margem */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="metric-label">Margem (%)</span>
              <span className="material-symbols-outlined text-verde/60" style={{ fontSize: '18px' }}>donut_small</span>
            </div>
            {loading ? <Sk className="h-8 w-32 mb-2" /> : (
              <p className="metric-value">{margem.toFixed(1)}%</p>
            )}
            {!loading && (
              <span className={`badge ${trendMarg > 0 ? 'badge-green' : trendMarg < 0 ? 'badge-red' : 'badge-gray'}`}>
                {fmtPct(trendMarg)} vs anterior
              </span>
            )}
          </div>
        </div>

        {/* Comissão do espaço — detalhe do cálculo */}
        {comissaoAtiva && !loading && (
          <div className="card border-l-4 border-l-dourado">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-dourado-escuro" style={{ fontSize: '16px' }}>percent</span>
              <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Comissão do espaço ({comissaoPct}%)</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Breakdown */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-secondary">Faturação bruta</span>
                  <span className="font-medium text-ink">{fmt(totalFaturacao)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-secondary">Despesas</span>
                  <span className="font-medium text-ink">− {fmt(totalDespesas)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-secondary">Comissão do espaço ({comissaoPct}%)</span>
                  <span className="font-medium text-red-500">− {fmt(comissaoDevida)}</span>
                </div>
                <div className="border-t border-black/8 pt-2 flex items-center justify-between text-sm font-semibold">
                  <span className="text-ink">Fica para ti</span>
                  <span className={resultadoRealComissao >= 0 ? 'text-verde' : 'text-red-600'}>{fmt(resultadoRealComissao)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evolução mensal */}
        <Section title="Evolução Mensal">
          {loading ? (
            <Sk className="h-64 w-full" />
          ) : monthlyData.length === 0 ? (
            <EmptyState msg="Sem dados para o período selecionado." />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-3 font-sans">Faturação vs Despesas</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0eee8" />
                      <XAxis dataKey="mesLabel" tick={axisStyle} />
                      <YAxis tick={axisStyle} tickFormatter={(v) => `${v}€`} width={54} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="faturacao" name="Faturação" fill={nicho.cor} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill={nicho.corDestaque} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-3 font-sans">Resultado líquido</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={monthlyData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0eee8" />
                      <XAxis dataKey="mesLabel" tick={axisStyle} />
                      <YAxis tick={axisStyle} tickFormatter={(v) => `${v}€`} width={54} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="resultado" name="Resultado" fill={nicho.cor} radius={[4, 4, 0, 0]} />
                      <Line
                        type="monotone"
                        dataKey="resultado"
                        name="Tendência"
                        stroke={nicho.corDestaque}
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border-t border-surface-secondary my-2" />

              {/* Monthly table */}
              <div className="overflow-x-auto rounded-xl border border-surface-secondary">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="bg-surface-secondary">
                      <th className="text-left px-4 py-3 font-semibold text-ink-secondary">Mês</th>
                      <th className="text-right px-4 py-3 font-semibold text-ink-secondary">Faturação</th>
                      <th className="text-right px-4 py-3 font-semibold text-ink-secondary">Despesas</th>
                      <th className="text-right px-4 py-3 font-semibold text-ink-secondary">Resultado</th>
                      <th className="text-right px-4 py-3 font-semibold text-ink-secondary">Margem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-secondary">
                    {monthlyData.map((m) => (
                      <tr key={m.mes} className="table-row-hover">
                        <td className="px-4 py-3 font-medium text-ink">{m.mesLabel}</td>
                        <td className="px-4 py-3 text-right text-verde font-medium">{fmt(m.faturacao)}</td>
                        <td className="px-4 py-3 text-right text-dourado">{fmt(m.despesas)}</td>
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
                    <tr className="bg-surface-secondary font-bold">
                      <td className="px-4 py-3 text-ink">Total</td>
                      <td className="px-4 py-3 text-right text-verde">{fmt(totalFaturacao)}</td>
                      <td className="px-4 py-3 text-right text-dourado">{fmt(totalDespesas)}</td>
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

        <div className="border-t border-surface-secondary" />

        {/* Análise de serviços */}
        <Section title="Análise de Serviços">
          {loading ? (
            <Sk className="h-64 w-full" />
          ) : servicosAnalise.length === 0 ? (
            <EmptyState msg="Sem serviços registados no período." />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-3 font-sans">Top serviços por receita</p>
                  <ResponsiveContainer width="100%" height={Math.max(200, servicosAnalise.length * 44)}>
                    <BarChart
                      layout="vertical"
                      data={servicosAnalise.slice(0, 8)}
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0eee8" horizontal={false} />
                      <XAxis type="number" tick={axisStyle} tickFormatter={(v) => `${v}€`} />
                      <YAxis type="category" dataKey="nome" tick={axisStyle} width={110} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="faturacaoTotal" name="Faturação" fill={nicho.cor} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border-t border-surface-secondary" />

              {/* Services table */}
              <div className="overflow-x-auto rounded-xl border border-surface-secondary">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="bg-surface-secondary">
                      <th className="text-left px-4 py-3 font-semibold text-ink-secondary">Serviço</th>
                      <th className="text-right px-4 py-3 font-semibold text-ink-secondary">Realizações</th>
                      <th className="text-right px-4 py-3 font-semibold text-ink-secondary">Faturação total</th>
                      <th className="text-right px-4 py-3 font-semibold text-ink-secondary">Faturação média</th>
                      <th className="text-right px-4 py-3 font-semibold text-ink-secondary">Tempo total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-secondary">
                    {servicosAnalise.map((s, idx) => (
                      <tr key={s.id} className="table-row-hover">
                        <td className="px-4 py-3 font-medium text-ink flex items-center gap-2 flex-wrap">
                          {s.nome}
                          {idx === 0 && (
                            <span className="badge badge-gold">Mais rentável</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-ink-secondary">{s.realizacoes}</td>
                        <td className="px-4 py-3 text-right text-verde font-medium">{fmt(s.faturacaoTotal)}</td>
                        <td className="px-4 py-3 text-right text-ink-secondary">{fmt(s.faturacaoMedia)}</td>
                        <td className="px-4 py-3 text-right text-ink-secondary">{s.tempoTotal} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Section>

        <div className="border-t border-surface-secondary" />

        {/* Marcações */}
        <Section title="Marcações">
          {loading ? (
            <Sk className="h-48 w-full" />
          ) : totalMarcacoes === 0 ? (
            <EmptyState msg="Sem marcações no período." />
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              {/* Pie chart */}
              <div className="w-full lg:w-[220px] lg:flex-shrink-0">
                <ResponsiveContainer width="100%" height={220}>
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
                      <Cell fill={nicho.cor} />
                      <Cell fill={nicho.corDestaque} />
                      <Cell fill="#d4d0c8" />
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}`, '']} contentStyle={{ background: 'white', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="rounded-xl bg-surface-secondary p-4">
                  <p className="text-xs text-ink-secondary font-medium font-sans">Total marcações</p>
                  <p className="font-serif text-2xl font-bold text-ink mt-1">{totalMarcacoes}</p>
                </div>
                <div className="rounded-xl bg-verde/5 p-4">
                  <p className="text-xs text-verde font-medium font-sans">Confirmadas</p>
                  <p className="font-serif text-2xl font-bold text-verde mt-1">{confirmadas}</p>
                </div>
                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs text-red-600 font-medium font-sans">Desistências</p>
                  <p className="font-serif text-2xl font-bold text-red-600 mt-1">{desistencias}</p>
                </div>
                <div className="rounded-xl bg-dourado/10 p-4">
                  <p className="text-xs text-dourado font-medium font-sans">Taxa desistência</p>
                  <p className="font-serif text-2xl font-bold text-dourado mt-1">{taxaDesistencia.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
        </Section>

        <div className="border-t border-surface-secondary" />

        {/* Gorjetas */}
        <Section title="Gorjetas">
          {loading ? (
            <Sk className="h-32 w-full" />
          ) : totalGorjetas === 0 ? (
            <EmptyState msg="Sem gorjetas registadas no período." />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-xl bg-verde/5 p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-verde mt-0.5" style={{ fontSize: '20px' }}>trophy</span>
                  <div>
                    <p className="text-xs text-verde font-medium font-sans">Total gorjetas</p>
                    <p className="font-serif text-2xl font-bold text-verde mt-1">{fmt(totalGorjetas)}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-dourado/10 p-4">
                  <p className="text-xs text-dourado font-medium font-sans">Média por serviço</p>
                  <p className="font-serif text-2xl font-bold text-dourado mt-1">{fmt(mediaGorjeta)}</p>
                </div>
                <div className="rounded-xl bg-surface-secondary p-4 col-span-2 sm:col-span-1">
                  <p className="text-xs text-ink-secondary font-medium font-sans mb-2">Distribuição por serviço</p>
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
                            <span className="text-xs text-ink-secondary w-20 truncate font-sans">{nome}</span>
                            <div className="flex-1 bg-surface-secondary rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{ width: `${pct}%`, background: 'rgb(var(--dourado))' }}
                              />
                            </div>
                            <span className="text-xs font-medium text-dourado w-14 text-right font-sans">{fmt(r.gorjeta)}</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Section>

        <div className="border-t border-surface-secondary" />

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
                <div className="rounded-xl bg-verde/5 p-4">
                  <p className="text-xs text-verde font-medium font-sans">Fixas</p>
                  <p className="font-serif text-xl font-bold text-verde mt-1">{fmt(despFixas)}</p>
                  <p className="text-xs text-ink-secondary mt-0.5 font-sans">{pctFixas.toFixed(1)}% do total</p>
                </div>
                <div className="rounded-xl bg-dourado/10 p-4">
                  <p className="text-xs text-dourado font-medium font-sans">Variáveis</p>
                  <p className="font-serif text-xl font-bold text-dourado mt-1">{fmt(despVariaveis)}</p>
                  <p className="text-xs text-ink-secondary mt-0.5 font-sans">{pctVariaveis.toFixed(1)}% do total</p>
                </div>
                <div className="col-span-2 rounded-xl bg-surface-secondary p-4">
                  <p className="text-xs text-ink-secondary font-medium font-sans mb-2">Proporção fixas / variáveis</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-verde w-10 font-sans">{pctFixas.toFixed(0)}%</span>
                    <div className="flex-1 h-3 bg-dourado/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-verde rounded-full transition-all"
                        style={{ width: `${pctFixas}%` }}
                      />
                    </div>
                    <span className="text-xs text-dourado w-10 text-right font-sans">{pctVariaveis.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-ink-secondary mt-1 font-sans">
                    <span>Fixas</span>
                    <span>Variáveis</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-surface-secondary" />

              {/* Pie by categoria + table */}
              <div className="flex flex-col lg:flex-row gap-6">
                {despCat.length > 0 && (
                  <div className="w-full lg:w-[260px] lg:flex-shrink-0">
                    <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-3 font-sans">Por categoria</p>
                    <ResponsiveContainer width="100%" height={260}>
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
                        <Tooltip formatter={(v) => [fmt(Number(v)), '']} contentStyle={{ background: 'white', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '8px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Despesas table */}
                <div className="flex-1 overflow-x-auto rounded-xl border border-surface-secondary">
                  <table className="w-full text-sm font-sans">
                    <thead>
                      <tr className="bg-surface-secondary">
                        <th className="text-left px-4 py-3 font-semibold text-ink-secondary">Descrição</th>
                        <th className="text-left px-4 py-3 font-semibold text-ink-secondary">Categoria</th>
                        <th className="text-left px-4 py-3 font-semibold text-ink-secondary">Tipo</th>
                        <th className="text-left px-4 py-3 font-semibold text-ink-secondary">Data</th>
                        <th className="text-right px-4 py-3 font-semibold text-ink-secondary">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-secondary">
                      {despesaRows
                        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                        .map((d) => (
                          <tr key={d.id} className="table-row-hover">
                            <td className="px-4 py-3 text-ink">{d.descricao}</td>
                            <td className="px-4 py-3">
                              <span className="badge badge-gray">{d.categoria}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${d.tipo === 'fixo' ? 'badge-green' : 'badge-amber'}`}>
                                {d.tipo === 'fixo' ? 'Fixa' : 'Variável'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-ink-secondary text-xs">
                              {new Date(d.data).toLocaleDateString('pt-PT')}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-dourado">{fmt(d.valor)}</td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface-secondary font-bold">
                        <td colSpan={4} className="px-4 py-3 text-ink">Total despesas</td>
                        <td className="px-4 py-3 text-right text-dourado">{fmt(totalDespesas)}</td>
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
