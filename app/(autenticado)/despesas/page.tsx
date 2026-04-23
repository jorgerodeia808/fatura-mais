'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────
interface Despesa {
  id: string
  descricao: string
  valor: number
  categoria: string
  tipo: 'fixo' | 'variavel'
  data: string
  criado_em: string
}

interface CustoFixo {
  descricao: string
  valor: number
  tipo: string
  categoria: string
}

// ── Categories config ──────────────────────────────────────────────
const CATEGORIAS = [
  { id: 'Rendas',           label: 'Renda',         icon: 'home' },
  { id: 'Água/Luz/Gás',    label: 'Energia',        icon: 'bolt' },
  { id: 'Internet/Telefone',label: 'Internet',      icon: 'wifi' },
  { id: 'Seguros',          label: 'Seguros',        icon: 'shield' },
  { id: 'Contabilidade',    label: 'Contabilidade',  icon: 'calculate' },
  { id: 'Marketing',        label: 'Marketing',      icon: 'campaign' },
  { id: 'Software',         label: 'Software',       icon: 'devices' },
  { id: 'Equipamento',      label: 'Materiais',      icon: 'construction' },
  { id: 'Outro',            label: 'Outro',          icon: 'more_horiz' },
]

function getCatIcon(categoriaId: string): string {
  return CATEGORIAS.find(c => c.id === categoriaId)?.icon ?? 'more_horiz'
}

function getCat(id: string) {
  return CATEGORIAS.find(c => c.id === id) ?? CATEGORIAS[CATEGORIAS.length - 1]
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

function monthLabel(y: number, m: number) {
  return new Date(y, m, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
}

function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f0eee8] rounded-lg ${className}`} />
}

// ── Main Page ──────────────────────────────────────────────────────
export default function DespesasPage() {
  const supabase = createClient()
  const subRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingDespesas, setLoadingDespesas] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [formError, setFormError] = useState('')
  const [filtro, setFiltro] = useState<'todas' | 'fixo' | 'variavel'>('todas')

  const [categoria, setCategoria] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState<'fixo' | 'variavel'>('variavel')

  const fetchDespesas = useCallback(async (bid: string, y: number, m: number) => {
    setLoadingDespesas(true)
    const start = new Date(y, m, 1).toISOString().split('T')[0]
    const end = new Date(y, m + 1, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('despesas')
      .select('*')
      .eq('barbearia_id', bid)
      .gte('data', start)
      .lte('data', end)
      .order('data', { ascending: false })
      .order('criado_em', { ascending: false })
    setDespesas((data as Despesa[]) ?? [])
    setLoadingDespesas(false)
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: barb } = await supabase
        .from('barbearias').select('id').eq('user_id', user.id).single()
      if (!barb) { setLoadingInit(false); return }
      setBarbeariaId(barb.id)
      await fetchDespesas(barb.id, now.getFullYear(), now.getMonth())
      setLoadingInit(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!barbeariaId) return
    if (subRef.current) supabase.removeChannel(subRef.current)
    const ch = supabase
      .channel(`despesas-${barbeariaId}-${year}-${month}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'despesas',
        filter: `barbearia_id=eq.${barbeariaId}`,
      }, () => fetchDespesas(barbeariaId, year, month))
      .subscribe()
    subRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [barbeariaId, year, month, supabase, fetchDespesas])

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const changeMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())) return
    setMonth(m)
    setYear(y)
    if (barbeariaId) fetchDespesas(barbeariaId, y, m)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoria) { setFormError('Seleciona uma categoria.'); return }
    if (!valor || parseFloat(valor) <= 0) { setFormError('Introduz um valor válido.'); return }
    if (!barbeariaId) return
    setFormError('')
    setSubmitting(true)
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('despesas').insert({
      barbearia_id: barbeariaId,
      descricao: descricao.trim() || categoria,
      valor: parseFloat(valor),
      categoria,
      tipo,
      data: today,
    })
    if (error) { setFormError('Erro ao registar. Tenta novamente.'); setSubmitting(false); return }
    setCategoria('')
    setDescricao('')
    setValor('')
    setTipo('variavel')
    setSuccessMsg('Despesa registada!')
    setTimeout(() => setSuccessMsg(''), 3000)
    setSubmitting(false)
    if (isCurrentMonth && barbeariaId) fetchDespesas(barbeariaId, year, month)
  }

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const deleteDespesa = async (id: string) => {
    await supabase.from('despesas').delete().eq('id', id)
    setConfirmDeleteId(null)
    if (barbeariaId) fetchDespesas(barbeariaId, year, month)
  }

  const handleImport = async () => {
    if (!barbeariaId) return
    setImporting(true)
    const { data: custos } = await supabase
      .from('custos_fixos').select('*').eq('barbearia_id', barbeariaId)
    if (!custos || custos.length === 0) {
      setSuccessMsg('Sem custos fixos configurados no onboarding.')
      setTimeout(() => setSuccessMsg(''), 4000)
      setImporting(false)
      return
    }
    const today = new Date().toISOString().split('T')[0]
    const rows = (custos as CustoFixo[]).map(c => ({
      barbearia_id: barbeariaId,
      descricao: c.descricao,
      valor: c.valor,
      categoria: c.categoria || 'Outro',
      tipo: c.tipo === 'fixo' ? 'fixo' : 'variavel',
      data: today,
    }))
    const { error } = await supabase.from('despesas').insert(rows)
    if (error) { setFormError('Erro ao importar.'); setImporting(false); return }
    setSuccessMsg(`${rows.length} custo(s) importado(s) com sucesso!`)
    setTimeout(() => setSuccessMsg(''), 4000)
    setImporting(false)
    fetchDespesas(barbeariaId, year, month)
  }

  const filtered = despesas.filter(d => filtro === 'todas' ? true : d.tipo === filtro)
  const totalMes = despesas.reduce((s, d) => s + d.valor, 0)
  const totalFixo = despesas.filter(d => d.tipo === 'fixo').reduce((s, d) => s + d.valor, 0)
  const totalVariavel = despesas.filter(d => d.tipo === 'variavel').reduce((s, d) => s + d.valor, 0)
  const catMaisGastos = (() => {
    if (despesas.length === 0) return '—'
    const map: Record<string, number> = {}
    despesas.forEach(d => { map[d.categoria] = (map[d.categoria] ?? 0) + d.valor })
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  })()

  if (loadingInit) {
    return (
      <div className="space-y-6">
        <Sk className="h-9 w-52" />
        <div className="grid grid-cols-3 gap-4">
          <Sk className="h-28" /><Sk className="h-28" /><Sk className="h-28" />
        </div>
        <div className="flex flex-col lg:flex-row gap-5">
          <Sk className="w-full lg:w-[340px] h-[480px] lg:flex-shrink-0" />
          <Sk className="flex-1 h-[480px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Despesas</h1>
          <p className="text-sm text-ink-secondary mt-0.5">Controla todos os custos da tua barbearia</p>
        </div>
        {isCurrentMonth && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="btn-secondary disabled:opacity-60"
          >
            {importing ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span>
            )}
            Importar custos fixos
          </button>
        )}
      </div>

      {/* ── Metric cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total do mês */}
        <div className="metric-card metric-card-accent">
          <p className="metric-label mb-3">Total do mês</p>
          {loadingDespesas ? <Sk className="h-9 w-28 mb-1" /> : (
            <p className="metric-value text-red-800">{fmt(totalMes)}</p>
          )}
          <p className="text-xs text-ink-secondary mt-1">{despesas.length} registos</p>
        </div>

        {/* Fixo vs variavel */}
        <div className="metric-card">
          <p className="metric-label mb-3">Custos fixos</p>
          {loadingDespesas ? <Sk className="h-9 w-24 mb-1" /> : (
            <p className="metric-value">{fmt(totalFixo)}</p>
          )}
          <p className="text-xs text-ink-secondary mt-1">
            {fmt(totalVariavel)} variáveis
          </p>
        </div>

        {/* Categoria com mais gastos */}
        <div className="metric-card">
          <p className="metric-label mb-3">Maior categoria</p>
          {loadingDespesas ? <Sk className="h-9 w-32 mb-1" /> : (
            <p className="font-serif font-bold text-2xl text-ink leading-none truncate">{catMaisGastos}</p>
          )}
          <p className="text-xs text-ink-secondary mt-1">categoria com mais gastos</p>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ── LEFT: Form ──────────────────────────────────────────── */}
        <div className="w-full lg:w-[340px] lg:flex-shrink-0">
          <div className="card">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#f0eee8]">
              <span className="material-symbols-outlined text-verde" style={{ fontSize: '20px' }}>add_circle</span>
              <h2 className="section-title">Registar Despesa</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Categoria */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-2 uppercase tracking-wide">
                  Categoria *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORIAS.map(cat => {
                    const active = categoria === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoria(active ? '' : cat.id)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all duration-150 btn-inline ${
                          active
                            ? 'bg-verde text-white shadow-sm'
                            : 'bg-[#f0eee8] text-ink-secondary hover:bg-[#e8e5dd]'
                        }`}
                        style={!active ? { border: '0.5px solid rgba(0,0,0,0.06)' } : {}}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '18px' }}
                        >
                          {cat.icon}
                        </span>
                        <span className="text-[10px] font-medium leading-tight text-center">{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                  Descrição
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  className="input-field"
                  placeholder="Ex: Fatura EDP Abril"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                  Valor (€) *
                </label>
                <input
                  type="number"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="0,00"
                  required
                />
              </div>

              {/* Tipo toggle */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                  Tipo de custo
                </label>
                <div className="flex rounded-lg overflow-hidden" style={{ border: '0.5px solid rgba(0,0,0,0.1)' }}>
                  <button
                    type="button"
                    onClick={() => setTipo('fixo')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-all duration-150 inline-flex items-center justify-center gap-1.5 btn-inline ${
                      tipo === 'fixo'
                        ? 'bg-dourado text-white'
                        : 'bg-white text-ink-secondary hover:bg-[#f0eee8]'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>push_pin</span>
                    Custo fixo
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('variavel')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-all duration-150 inline-flex items-center justify-center gap-1.5 btn-inline ${
                      tipo === 'variavel'
                        ? 'bg-verde text-white'
                        : 'bg-white text-ink-secondary hover:bg-[#f0eee8]'
                    }`}
                    style={{ borderLeft: '0.5px solid rgba(0,0,0,0.08)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>show_chart</span>
                    Variável
                  </button>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-700 text-xs bg-red-50 px-3 py-2 rounded-lg" style={{ border: '0.5px solid #fca5a5' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                  {formError}
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 text-emerald-700 text-xs bg-emerald-50 px-3 py-2 rounded-lg" style={{ border: '0.5px solid #6ee7b7' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    A registar...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    Registar despesa
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT: List ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Card header */}
            <div className="px-6 py-4 border-b border-[#f0eee8]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-verde" style={{ fontSize: '18px' }}>receipt</span>
                  <h2 className="section-title text-base">Despesas do mês</h2>
                </div>

                {/* Month navigation */}
                <div className="flex items-center gap-1 bg-[#f0eee8] rounded-lg px-2 py-1">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white transition-colors text-ink-secondary btn-inline"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
                  </button>
                  <span className="text-xs font-medium text-ink min-w-[120px] text-center capitalize">
                    {monthLabel(year, month)}
                  </span>
                  <button
                    onClick={() => changeMonth(1)}
                    disabled={isCurrentMonth}
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white transition-colors text-ink-secondary disabled:opacity-30 disabled:cursor-not-allowed btn-inline"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2">
                {([
                  { id: 'todas', label: 'Todas' },
                  { id: 'fixo', label: 'Fixas' },
                  { id: 'variavel', label: 'Variáveis' },
                ] as const).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFiltro(f.id)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150 btn-inline ${
                      filtro === f.id
                        ? 'bg-verde text-white'
                        : 'bg-[#f0eee8] text-ink-secondary hover:bg-[#e8e5dd]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <span className="ml-auto text-xs text-ink-secondary">{filtered.length} registos</span>
              </div>
            </div>

            {/* List content */}
            {loadingDespesas ? (
              <div className="p-6 space-y-3">
                {[1,2,3,4].map(i => <Sk key={i} className="h-14 w-full"/>)}
              </div>
            ) : despesas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-14 h-14 bg-[#f0eee8] rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-ink-secondary" style={{ fontSize: '28px' }}>receipt_long</span>
                </div>
                <p className="font-serif font-semibold text-ink text-lg mb-1">
                  Sem despesas {isCurrentMonth ? 'este mês' : 'neste mês'}
                </p>
                <p className="text-sm text-ink-secondary max-w-xs mb-6">
                  Regista os teus custos fixos e variáveis para acompanhar a rentabilidade da barbearia.
                </p>
                {isCurrentMonth && (
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="btn-secondary disabled:opacity-60"
                  >
                    {importing ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span>
                    )}
                    Importar custos fixos do onboarding
                  </button>
                )}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-ink-secondary text-sm">
                Sem despesas com este filtro.
              </div>
            ) : (
              <div className="px-6">
                {filtered.map(d => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between py-3 border-b border-[#f0eee8] last:border-0 table-row-hover px-1 -mx-1 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#f0eee8] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-ink-secondary" style={{ fontSize: '16px' }}>
                          {getCatIcon(d.categoria)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{d.descricao}</p>
                        <p className="text-xs text-ink-secondary mt-0.5">
                          {d.categoria}
                          {' · '}
                          {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <p className="font-serif font-medium text-red-700 text-base">
                        {fmt(d.valor)}
                      </p>
                      <span className={`badge ${d.tipo === 'fixo' ? 'badge-blue' : 'badge-amber'}`}>
                        {d.tipo === 'fixo' ? 'fixo' : 'variável'}
                      </span>
                      {confirmDeleteId === d.id ? (
                        <>
                          <button
                            onClick={() => deleteDespesa(d.id)}
                            className="btn-inline text-xs bg-red-600 text-white px-2 py-1 rounded-md font-medium hover:bg-red-700 transition-colors"
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="btn-inline text-xs text-ink-secondary hover:text-ink px-1.5 py-1 rounded-md transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(d.id)}
                          className="btn-inline w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-ink-secondary hover:text-red-600 transition-colors"
                          title="Eliminar despesa"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer: import shortcut when list has entries */}
            {despesas.length > 0 && isCurrentMonth && (
              <div className="px-6 py-3 border-t border-[#f0eee8]">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="btn-ghost text-xs py-1.5 px-2 disabled:opacity-60"
                >
                  {importing ? (
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>upload</span>
                  )}
                  Importar custos fixos do onboarding
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
