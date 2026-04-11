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
  {
    id: 'Rendas',
    label: 'Renda',
    bg: 'bg-emerald-50',
    activeBg: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'Água/Luz/Gás',
    label: 'Energia',
    bg: 'bg-yellow-50',
    activeBg: 'bg-yellow-100',
    text: 'text-yellow-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'Marketing',
    label: 'Marketing',
    bg: 'bg-purple-50',
    activeBg: 'bg-purple-100',
    text: 'text-purple-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    id: 'Equipamento',
    label: 'Materiais',
    bg: 'bg-blue-50',
    activeBg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    ),
  },
  {
    id: 'Contabilidade',
    label: 'Pessoal',
    bg: 'bg-orange-50',
    activeBg: 'bg-orange-100',
    text: 'text-orange-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'Outro',
    label: 'Outro',
    bg: 'bg-gray-50',
    activeBg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
]

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
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
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

  if (loadingInit) {
    return (
      <div className="space-y-6">
        <Sk className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4"><Sk className="h-24" /><Sk className="h-24" /><Sk className="h-24" /></div>
        <div className="flex flex-col lg:flex-row gap-4"><Sk className="w-full lg:w-[300px] h-96 lg:flex-shrink-0" /><Sk className="flex-1 h-96" /></div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#0e4324]">Despesas</h1>
        <p className="text-gray-500 text-sm mt-0.5">Controla todos os custos da tua barbearia</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total do mês', value: fmt(totalMes), icon: '💳', sub: `${despesas.length} registos` },
          { label: 'Custos fixos', value: fmt(totalFixo), icon: '📌', sub: `${despesas.filter(d => d.tipo === 'fixo').length} itens` },
          { label: 'Custos variáveis', value: fmt(totalVariavel), icon: '📊', sub: `${despesas.filter(d => d.tipo === 'variavel').length} itens` },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{m.icon}</span>
              <span className="text-xs text-gray-400">{m.sub}</span>
            </div>
            {loadingDespesas ? <Sk className="h-7 w-28 mb-1" /> : (
              <p className="text-2xl font-bold text-[#0e4324]">{m.value}</p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* LEFT: Form */}
        <div className="w-full lg:w-[300px] lg:flex-shrink-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-[#0e4324] px-5 py-4">
            <h2 className="text-white font-semibold">Registar despesa</h2>
            <p className="text-white/60 text-xs mt-0.5">Adiciona um novo custo</p>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Categoria */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Categoria *</label>
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORIAS.map(cat => {
                  const active = categoria === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoria(active ? '' : cat.id)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                        active
                          ? `border-[#0e4324] ${cat.activeBg} ${cat.text}`
                          : `border-transparent ${cat.bg} ${cat.text} hover:border-gray-200`
                      }`}
                    >
                      {cat.icon}
                      <span className="text-[10px] font-medium leading-tight text-center">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Descrição</label>
              <input
                type="text"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e4324] focus:border-transparent text-sm text-gray-800 placeholder-gray-400"
                placeholder="Ex: Fatura EDP Abril"
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Valor (€) *</label>
              <input
                type="number"
                value={valor}
                onChange={e => setValor(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e4324] focus:border-transparent text-sm text-gray-800 placeholder-gray-400"
                placeholder="0,00"
                required
              />
            </div>

            {/* Tipo toggle */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo</label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTipo('fixo')}
                  className={`flex-1 py-2 text-sm font-medium transition-all ${
                    tipo === 'fixo'
                      ? 'bg-[#977c30] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  📌 Custo fixo
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('variavel')}
                  className={`flex-1 py-2 text-sm font-medium transition-all border-l border-gray-200 ${
                    tipo === 'variavel'
                      ? 'bg-[#0e4324] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  📊 Variável
                </button>
              </div>
            </div>

            {formError && (
              <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg border border-red-100">{formError}</p>
            )}
            {successMsg && (
              <p className="text-green-700 text-xs bg-green-50 px-3 py-2 rounded-lg border border-green-100 flex items-center gap-1.5">
                <span>✓</span> {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0e4324] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0a3019] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  Registar despesa
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT: Histórico */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-[#0e4324] text-sm">Despesas do mês</h2>
              {/* Month nav */}
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-2 py-1">
                <button
                  onClick={() => changeMonth(-1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-gray-500"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <span className="text-xs font-medium text-[#0e4324] min-w-[110px] text-center capitalize">
                  {monthLabel(year, month)}
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  disabled={isCurrentMonth}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
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
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filtro === f.id
                      ? 'bg-[#0e4324] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-400">{filtered.length} registos</span>
            </div>
          </div>

          {loadingDespesas ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4].map(i => <Sk key={i} className="h-14 w-full"/>)}
            </div>
          ) : despesas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 bg-[#0e4324]/5 rounded-full flex items-center justify-center mb-3">
                <span className="text-3xl">💳</span>
              </div>
              <p className="font-semibold text-[#0e4324] mb-1">Sem despesas {isCurrentMonth ? 'este mês' : 'neste mês'}</p>
              <p className="text-sm text-gray-400 max-w-xs mb-5">
                Regista os teus custos fixos e variáveis para acompanhar a rentabilidade da barbearia.
              </p>
              {isCurrentMonth && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="inline-flex items-center gap-2 bg-[#977c30] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#7a6325] transition-colors disabled:opacity-60"
                >
                  {importing ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                  )}
                  Importar custos fixos do onboarding
                </button>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Sem despesas com este filtro.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(d => {
                const cat = getCat(d.categoria)
                return (
                  <div key={d.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.bg} ${cat.text}`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{d.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{d.categoria}</span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400">
                          {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-sm font-bold text-[#a32d2d]">–{fmt(d.valor)}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        d.tipo === 'fixo'
                          ? 'bg-[#977c30]/10 text-[#977c30]'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {d.tipo === 'fixo' ? 'Custo fixo' : 'Variável'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {despesas.length > 0 && isCurrentMonth && (
            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={handleImport}
                disabled={importing}
                className="text-xs text-[#977c30] hover:text-[#7a6325] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-60"
              >
                {importing ? (
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                )}
                Importar custos fixos do onboarding
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
