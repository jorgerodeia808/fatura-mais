'use client'

import { useState, useRef } from 'react'
import type { ClienteConsultoria } from './page'
import RelatorioFP, { type RelatorioFPData } from './RelatorioFP'
import RelatorioNicho, { type RelatorioNichoData } from './RelatorioNicho'

const nichoLabel: Record<string, string> = {
  barbeiro: 'Barbearia', nails: 'Nails+', lash: 'Lash+', tatuador: 'Tattoo+', fp: 'FP+',
}
const nichoBg: Record<string, string> = {
  barbeiro: '#2d2d2d', nails: '#c2185b', lash: '#4a148c', tatuador: '#111111', fp: '#1e3a5f',
}

const PERIODOS = [
  { label: 'Este mês', value: 'mes_atual' },
  { label: 'Mês anterior', value: 'mes_anterior' },
  { label: 'Últimos 3 meses', value: 'tres_meses' },
  { label: 'Últimos 6 meses', value: 'seis_meses' },
  { label: 'Este ano', value: 'ano_atual' },
  { label: 'Personalizado', value: 'custom' },
]

function getPeriodDates(period: string, customStart?: string, customEnd?: string) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  switch (period) {
    case 'mes_atual':
      return { start: fmt(new Date(y, m, 1)), end: fmt(new Date(y, m + 1, 0)) }
    case 'mes_anterior':
      return { start: fmt(new Date(y, m - 1, 1)), end: fmt(new Date(y, m, 0)) }
    case 'tres_meses':
      return { start: fmt(new Date(y, m - 2, 1)), end: fmt(new Date(y, m + 1, 0)) }
    case 'seis_meses':
      return { start: fmt(new Date(y, m - 5, 1)), end: fmt(new Date(y, m + 1, 0)) }
    case 'ano_atual':
      return { start: `${y}-01-01`, end: `${y}-12-31` }
    case 'custom':
      return { start: customStart ?? fmt(new Date(y, m, 1)), end: customEnd ?? fmt(new Date(y, m + 1, 0)) }
    default:
      return { start: fmt(new Date(y, m, 1)), end: fmt(new Date(y, m + 1, 0)) }
  }
}

function getPeriodLabel(period: string, customStart?: string, customEnd?: string) {
  if (period === 'custom' && customStart && customEnd) {
    const fmtLabel = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
    return `${fmtLabel(customStart)} — ${fmtLabel(customEnd)}`
  }
  return PERIODOS.find(p => p.value === period)?.label ?? period
}

export default function ConsultoriaAdmin({ clientes }: { clientes: ClienteConsultoria[] }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ClienteConsultoria | null>(null)
  const [periodo, setPeriodo] = useState('mes_atual')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [activeTab, setActiveTab] = useState<'fp' | 'nicho'>('nicho')
  const [reportData, setReportData] = useState<RelatorioFPData | RelatorioNichoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const reportRef = useRef<HTMLDivElement>(null)

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectCliente = (c: ClienteConsultoria) => {
    setSelected(c)
    setReportData(null)
    setError('')
    // Default tab: prefer nicho if has it, else fp
    setActiveTab(c.tipos.includes('nicho') ? 'nicho' : 'fp')
  }

  const handleGenerate = async () => {
    if (!selected) return
    const { start, end } = getPeriodDates(periodo, customStart, customEnd)
    const tipo = activeTab

    setLoading(true)
    setError('')
    setReportData(null)

    try {
      const res = await fetch(
        `/api/admin/consultoria/relatorio?user_id=${selected.user_id}&tipo=${tipo}&data_inicio=${start}&data_fim=${end}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido')
      setReportData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!reportRef.current || !selected) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f9fafb',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = 210
      const pageHeight = 297
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let yPos = 0
      let page = 0
      while (yPos < imgHeight) {
        if (page > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -yPos, imgWidth, imgHeight)
        yPos += pageHeight
        page++
      }

      const name = selected.nome.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      const periodoLabel = getPeriodLabel(periodo, customStart, customEnd).replace(/[^a-zA-Z0-9]/g, '-')
      pdf.save(`relatorio-${name}-${periodoLabel}.pdf`)
    } catch (e) {
      console.error('PDF export error:', e)
    } finally {
      setExporting(false)
    }
  }

  const periodDates = getPeriodDates(periodo, customStart, customEnd)
  const periodoLabel = getPeriodLabel(periodo, customStart, customEnd)

  return (
    <div className="flex gap-6 h-full">

      {/* Sidebar: client selector */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Consultoria</h2>
          <p className="text-xs text-gray-500 mt-0.5">Seleciona um cliente para gerar um relatório</p>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-gray-400">search</span>
          <input
            type="text"
            placeholder="Pesquisar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e4324]/20 focus:border-[#0e4324]"
          />
        </div>

        {/* Client list */}
        <div className="flex-1 overflow-y-auto space-y-1 max-h-[calc(100vh-280px)]">
          {filtered.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">Nenhum cliente encontrado</p>
          )}
          {filtered.map(c => (
            <button
              key={c.user_id}
              onClick={() => handleSelectCliente(c)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                selected?.user_id === c.user_id
                  ? 'border-[#0e4324] bg-[#0e4324]/5'
                  : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.nome}</p>
                  <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {c.tipos.map(t => (
                    <span
                      key={t}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: nichoBg[t === 'nicho' ? (c.nicho ?? 'barbeiro') : 'fp'] }}
                    >
                      {t === 'fp' ? 'FP+' : nichoLabel[c.nicho] ?? c.nicho}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {!selected ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-[48px] text-gray-200 block mb-3">person_search</span>
              <p className="text-sm text-gray-400">Seleciona um cliente para começar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Controls panel */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Selected client */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: nichoBg[selected.nicho] }}>
                    {selected.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selected.nome}</p>
                    <p className="text-[11px] text-gray-400">{selected.email}</p>
                  </div>
                </div>

                <div className="w-px h-8 bg-gray-200" />

                {/* Module tabs (only show if client has both) */}
                {selected.tipos.length > 1 && (
                  <>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                      {selected.tipos.map(t => (
                        <button
                          key={t}
                          onClick={() => { setActiveTab(t); setReportData(null) }}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                            activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                          }`}
                        >
                          {t === 'fp' ? 'Finanças Pessoais' : `${nichoLabel[selected.nicho]} (Negócio)`}
                        </button>
                      ))}
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                  </>
                )}

                {/* Period selector */}
                <select
                  value={periodo}
                  onChange={e => { setPeriodo(e.target.value); setReportData(null) }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e4324]/20"
                >
                  {PERIODOS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>

                {periodo === 'custom' && (
                  <>
                    <input
                      type="date"
                      value={customStart}
                      onChange={e => { setCustomStart(e.target.value); setReportData(null) }}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none"
                    />
                    <span className="text-xs text-gray-400">até</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={e => { setCustomEnd(e.target.value); setReportData(null) }}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none"
                    />
                  </>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading || (periodo === 'custom' && (!customStart || !customEnd))}
                  className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#0e4324' }}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                      A gerar...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">analytics</span>
                      Gerar Relatório
                    </>
                  )}
                </button>
              </div>

              {/* Period info */}
              {!loading && (
                <p className="text-[11px] text-gray-400 mt-2">
                  {periodoLabel}
                  {periodo !== 'custom' && ` · ${periodDates.start} → ${periodDates.end}`}
                  {` · ${activeTab === 'fp' ? 'Finanças Pessoais (FP+)' : `${nichoLabel[selected.nicho] ?? 'Negócio'}`}`}
                </p>
              )}
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">error</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-4">
                <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
                <div className="h-56 bg-gray-100 rounded-xl animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              </div>
            )}

            {/* Report */}
            {!loading && reportData && reportData.tipo === 'fp' && (
              <RelatorioFP
                data={reportData as RelatorioFPData}
                clienteNome={selected.nome}
                periodoLabel={periodoLabel}
                reportRef={reportRef}
                onExportPDF={handleExportPDF}
                exporting={exporting}
              />
            )}
            {!loading && reportData && reportData.tipo === 'nicho' && (
              <RelatorioNicho
                data={reportData as RelatorioNichoData}
                clienteNome={selected.nome}
                periodoLabel={periodoLabel}
                reportRef={reportRef}
                onExportPDF={handleExportPDF}
                exporting={exporting}
              />
            )}

            {/* Empty state */}
            {!loading && !reportData && !error && (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
                <span className="material-symbols-outlined text-[48px] text-gray-200 block mb-3">insert_chart</span>
                <p className="text-sm font-medium text-gray-500">Configura o período e clica em "Gerar Relatório"</p>
                <p className="text-xs text-gray-400 mt-1">O relatório incluirá gráficos, análise financeira e insights automáticos</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
