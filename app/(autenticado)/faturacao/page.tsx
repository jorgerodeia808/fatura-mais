'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────
interface Servico {
  id: string
  nome: string
  preco: number
  tempo_minutos: number
}

interface RegistoItem {
  id: string
  cliente_nome: string | null
  servico_id: string | null
  valor: number
  gorjeta: number
  estado: 'concluido' | 'pendente' | 'desistencia'
  data_hora: string
  servicos: { nome: string; tempo_minutos: number } | null
}

// ── Helpers ────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function formatDataLabel(d: Date) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).toISOString()
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString()
}

// ── Skeleton ───────────────────────────────────────────────────────
function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f0eee8] rounded-lg ${className}`} />
}

// ── Badge de estado ────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: string }) {
  if (estado === 'concluido') return <span className="badge-green">Concluído</span>
  if (estado === 'pendente') return <span className="badge-amber">Pendente</span>
  if (estado === 'desistencia') return <span className="badge-red">Desistência</span>
  return <span className="badge-gray">{estado}</span>
}

// ── Main Page ──────────────────────────────────────────────────────
export default function FaturacaoPage() {
  const supabase = createClient()
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // State
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [registos, setRegistos] = useState<RegistoItem[]>([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingRegistos, setLoadingRegistos] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Form state
  const [clienteNome, setClienteNome] = useState('')
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [gorjetaPill, setGorjetaPill] = useState<number | null>(null)
  const [gorjetaManual, setGorjetaManual] = useState('')
  const [estado, setEstado] = useState<'concluido' | 'pendente' | 'desistencia'>('concluido')
  const [successMsg, setSuccessMsg] = useState('')
  const [formError, setFormError] = useState('')

  const gorjetaTotal = (gorjetaPill ?? 0) + (parseFloat(gorjetaManual) || 0)

  // ── Fetch registos ───────────────────────────────────────────────
  const fetchRegistos = useCallback(async (bid: string, date: Date) => {
    setLoadingRegistos(true)
    const { data } = await supabase
      .from('faturacao')
      .select('id, cliente_nome, servico_id, valor, gorjeta, estado, data_hora, servicos(nome, tempo_minutos)')
      .eq('barbearia_id', bid)
      .gte('data_hora', startOfDay(date))
      .lte('data_hora', endOfDay(date))
      .order('data_hora', { ascending: false })
    setRegistos((data as unknown as RegistoItem[]) ?? [])
    setLoadingRegistos(false)
  }, [supabase])

  // ── Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: barb } = await supabase
        .from('barbearias')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!barb) { setLoadingInit(false); return }
      setBarbeariaId(barb.id)
      const { data: servs } = await supabase
        .from('servicos')
        .select('id, nome, preco, tempo_minutos')
        .eq('barbearia_id', barb.id)
        .eq('ativo', true)
        .order('nome')
      setServicos((servs as Servico[]) ?? [])
      await fetchRegistos(barb.id, new Date())
      setLoadingInit(false)
    }
    init()
  }, [supabase, fetchRegistos])

  // ── Realtime subscription ────────────────────────────────────────
  useEffect(() => {
    if (!barbeariaId) return
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
    }
    const channel = supabase
      .channel(`faturacao-${barbeariaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'faturacao', filter: `barbearia_id=eq.${barbeariaId}` },
        () => { fetchRegistos(barbeariaId, selectedDate) }
      )
      .subscribe()
    subscriptionRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [barbeariaId, selectedDate, supabase, fetchRegistos])

  // ── Date navigation ──────────────────────────────────────────────
  const changeDate = (delta: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    if (d > new Date()) return
    setSelectedDate(d)
    if (barbeariaId) fetchRegistos(barbeariaId, d)
  }

  // ── Submit form ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServico) { setFormError('Seleciona um serviço.'); return }
    if (!barbeariaId) return
    setFormError('')
    setSubmitting(true)
    const { error } = await supabase.from('faturacao').insert({
      barbearia_id: barbeariaId,
      cliente_nome: clienteNome.trim() || null,
      servico_id: selectedServico.id,
      valor: selectedServico.preco,
      gorjeta: gorjetaTotal,
      estado,
      data_hora: new Date().toISOString(),
    })
    if (error) {
      setFormError('Erro ao registar. Tenta novamente.')
      setSubmitting(false)
      return
    }
    // Reset form
    setClienteNome('')
    setSelectedServico(null)
    setGorjetaPill(null)
    setGorjetaManual('')
    setEstado('concluido')
    setSuccessMsg('Serviço registado!')
    setTimeout(() => setSuccessMsg(''), 3000)
    setSubmitting(false)
    // If viewing today, refresh list (realtime will handle it but let's be sure)
    const today = new Date()
    if (selectedDate.toDateString() === today.toDateString()) {
      fetchRegistos(barbeariaId, selectedDate)
    }
  }

  // ── Update estado ────────────────────────────────────────────────
  const updateEstado = async (id: string, novoEstado: string) => {
    await supabase.from('faturacao').update({ estado: novoEstado }).eq('id', id)
    if (barbeariaId) fetchRegistos(barbeariaId, selectedDate)
  }

  // ── Delete registo ────────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const deleteRegisto = async (id: string) => {
    await supabase.from('faturacao').delete().eq('id', id)
    setConfirmDeleteId(null)
    if (barbeariaId) fetchRegistos(barbeariaId, selectedDate)
  }

  // ── Edit registo ──────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ cliente_nome: '', servico_id: '', gorjeta: '', estado: 'concluido' })

  const startEdit = (r: RegistoItem) => {
    setEditId(r.id)
    setEditForm({
      cliente_nome: r.cliente_nome ?? '',
      servico_id: r.servico_id ?? '',
      gorjeta: r.gorjeta > 0 ? String(r.gorjeta) : '',
      estado: r.estado,
    })
    setConfirmDeleteId(null)
  }

  const saveEdit = async () => {
    if (!editId || !barbeariaId) return
    const servico = servicos.find(s => s.id === editForm.servico_id)
    await supabase.from('faturacao').update({
      cliente_nome: editForm.cliente_nome.trim() || null,
      servico_id: editForm.servico_id || null,
      valor: servico?.preco ?? registos.find(r => r.id === editId)?.valor ?? 0,
      gorjeta: parseFloat(editForm.gorjeta) || 0,
      estado: editForm.estado,
    }).eq('id', editId)
    setEditId(null)
    fetchRegistos(barbeariaId, selectedDate)
  }

  // ── Metrics ──────────────────────────────────────────────────────
  const today = new Date()
  const isToday = selectedDate.toDateString() === today.toDateString()
  const registosConcluidos = registos.filter(r => r.estado === 'concluido')
  const faturadoTotal = registosConcluidos.reduce((s, r) => s + r.valor, 0)
  const gorjetasTotal = registosConcluidos.reduce((s, r) => s + (r.gorjeta ?? 0), 0)
  const servicosCount = registosConcluidos.length
  const ticketMedio = servicosCount > 0 ? faturadoTotal / servicosCount : 0

  const PILL_AMOUNTS = [1, 2, 5]

  if (loadingInit) {
    return (
      <div className="space-y-6">
        <Sk className="h-9 w-52" />
        <div className="grid grid-cols-3 gap-4">
          <Sk className="h-28" /><Sk className="h-28" /><Sk className="h-28" />
        </div>
        <div className="flex gap-4">
          <Sk className="w-[360px] h-[480px] flex-shrink-0" />
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
          <h1 className="page-title">Faturação</h1>
          <p className="text-sm text-ink-secondary mt-0.5">Regista os serviços de hoje</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date navigation */}
          <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1" style={{ border: '0.5px solid rgba(0,0,0,0.08)' }}>
            <button
              onClick={() => changeDate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f0eee8] transition-colors text-ink-secondary btn-inline"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            <span className="text-sm font-medium text-ink min-w-[150px] text-center px-1">
              {isToday
                ? `Hoje, ${selectedDate.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}`
                : formatDataLabel(selectedDate)}
            </span>
            <button
              onClick={() => changeDate(1)}
              disabled={isToday}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f0eee8] transition-colors text-ink-secondary disabled:opacity-30 disabled:cursor-not-allowed btn-inline"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>
          <span className="text-sm text-ink-secondary bg-[#f0eee8] px-3 py-1 rounded-full hidden sm:inline">
            {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* ── Metric cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Receita do dia */}
        <div className="metric-card metric-card-accent">
          <p className="metric-label mb-3">{isToday ? 'Receita do dia' : 'Receita faturada'}</p>
          {loadingRegistos ? <Sk className="h-9 w-28 mb-1" /> : (
            <p className="metric-value text-verde">{fmt(faturadoTotal)}</p>
          )}
          {gorjetasTotal > 0 && (
            <p className="text-xs text-[#977c30] font-medium mt-1">+{fmt(gorjetasTotal)} gorjetas</p>
          )}
        </div>

        {/* N.º servicos */}
        <div className="metric-card">
          <p className="metric-label mb-3">{isToday ? 'Serviços hoje' : 'Serviços'}</p>
          {loadingRegistos ? <Sk className="h-9 w-16 mb-1" /> : (
            <p className="metric-value">{servicosCount}</p>
          )}
          <p className="text-xs text-ink-secondary mt-1">
            {registos.filter(r => r.estado === 'pendente').length} pendentes
          </p>
        </div>

        {/* Ticket médio */}
        <div className="metric-card">
          <p className="metric-label mb-3">Ticket médio</p>
          {loadingRegistos ? <Sk className="h-9 w-24 mb-1" /> : (
            <p className="metric-value">{fmt(ticketMedio)}</p>
          )}
          <p className="text-xs text-ink-secondary mt-1">por serviço concluído</p>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ── LEFT: Form ──────────────────────────────────────────── */}
        <div className="w-full lg:w-[360px] lg:flex-shrink-0">
          <div className="card">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#f0eee8]">
              <span className="material-symbols-outlined text-verde" style={{ fontSize: '20px' }}>receipt_long</span>
              <h2 className="section-title">Novo Registo</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Cliente */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                  Cliente (opcional)
                </label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={e => setClienteNome(e.target.value)}
                  className="input-field"
                  placeholder="Ex: João Silva"
                />
              </div>

              {/* Servicos */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                  Serviço *
                </label>
                {servicos.length === 0 ? (
                  <div className="text-center py-5 text-xs text-ink-secondary border border-dashed border-black/10 rounded-lg">
                    <a href="/configuracoes" className="text-[#977c30] underline font-medium">Configura serviços</a> primeiro
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {servicos.map(s => {
                      const active = selectedServico?.id === s.id
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedServico(active ? null : s)}
                          className={`p-3 rounded-lg text-left transition-all duration-150 btn-inline ${
                            active
                              ? 'bg-verde text-white shadow-sm'
                              : 'bg-[#f0eee8] hover:bg-[#e8e5dd] text-ink border border-black/5'
                          }`}
                        >
                          <p className="text-sm font-medium leading-tight">{s.nome}</p>
                          <p className={`text-xs mt-1 font-serif font-semibold ${active ? 'text-white/80' : 'text-ink-secondary'}`}>
                            {fmt(s.preco)}
                          </p>
                          <p className={`text-xs mt-0.5 ${active ? 'text-white/60' : 'text-ink-secondary'}`}>
                            {s.tempo_minutos} min
                          </p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Gorjeta */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                  Gorjeta{gorjetaTotal > 0 && (
                    <span className="ml-1.5 text-[#977c30] font-semibold normal-case tracking-normal">
                      +{fmt(gorjetaTotal)}
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  {PILL_AMOUNTS.map(a => {
                    const active = gorjetaPill === a
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => { setGorjetaPill(active ? null : a); setGorjetaManual('') }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 btn-inline ${
                          active
                            ? 'bg-[#977c30] text-white'
                            : 'bg-[#f0eee8] text-ink-secondary hover:bg-[#e8e5dd]'
                        }`}
                        style={!active ? { border: '0.5px solid rgba(0,0,0,0.06)' } : {}}
                      >
                        +{a}€
                      </button>
                    )
                  })}
                  <input
                    type="number"
                    value={gorjetaManual}
                    onChange={e => { setGorjetaManual(e.target.value); setGorjetaPill(null) }}
                    placeholder="Outro €"
                    min="0"
                    step="0.50"
                    className="input-field flex-1"
                    style={{ minWidth: 0 }}
                  />
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                  Estado
                </label>
                <select
                  value={estado}
                  onChange={e => setEstado(e.target.value as typeof estado)}
                  className="input-field"
                >
                  <option value="concluido">Concluído</option>
                  <option value="pendente">Pendente</option>
                  <option value="desistencia">Desistência</option>
                </select>
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
                disabled={submitting || !selectedServico}
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
                    Registar serviço
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT: Historico ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Card header */}
            <div className="px-6 py-4 border-b border-[#f0eee8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-verde" style={{ fontSize: '18px' }}>history</span>
                <h2 className="section-title text-base">
                  Histórico — {isToday ? 'hoje' : selectedDate.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                </h2>
              </div>
              <span className="text-xs text-ink-secondary bg-[#f0eee8] px-2.5 py-1 rounded-full">
                {registos.length} registos
              </span>
            </div>

            {loadingRegistos ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <Sk key={i} className="h-[68px] w-full" />)}
              </div>
            ) : registos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-14 h-14 bg-[#f0eee8] rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-ink-secondary" style={{ fontSize: '28px' }}>cut</span>
                </div>
                <p className="font-serif font-semibold text-ink text-lg mb-1">
                  {isToday ? 'Ainda sem serviços hoje' : 'Sem registos neste dia'}
                </p>
                <p className="text-sm text-ink-secondary max-w-xs">
                  {isToday
                    ? 'Usa o formulário ao lado para registar o primeiro serviço do dia.'
                    : 'Não foram registados serviços neste dia.'}
                </p>
              </div>
            ) : (
              <div className="px-6">
                {registos.map(r => {
                  const servicoNome = (r.servicos as { nome: string; tempo_minutos: number } | null)?.nome ?? 'Serviço removido'
                  const servicoMin = (r.servicos as { nome: string; tempo_minutos: number } | null)?.tempo_minutos
                  const isEditing = editId === r.id

                  if (isEditing) {
                    return (
                      <div key={r.id} className="py-3 border-b border-[#f0eee8] last:border-0">
                        <div className="bg-[#f8f6f1] rounded-xl p-4 space-y-3">
                          <p className="text-xs font-medium text-ink-secondary uppercase tracking-wide">Editar registo · {formatHora(r.data_hora)}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <label className="block text-[10px] font-medium text-ink-secondary mb-1 uppercase tracking-wide">Cliente</label>
                              <input
                                type="text"
                                value={editForm.cliente_nome}
                                onChange={e => setEditForm(f => ({ ...f, cliente_nome: e.target.value }))}
                                placeholder="Cliente anónimo"
                                className="w-full border border-[#e8e4dc] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-verde bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-ink-secondary mb-1 uppercase tracking-wide">Serviço</label>
                              <select
                                value={editForm.servico_id}
                                onChange={e => setEditForm(f => ({ ...f, servico_id: e.target.value }))}
                                className="w-full border border-[#e8e4dc] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-verde bg-white"
                              >
                                <option value="">— sem serviço —</option>
                                {servicos.map(s => (
                                  <option key={s.id} value={s.id}>{s.nome} ({fmt(s.preco)})</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-ink-secondary mb-1 uppercase tracking-wide">Gorjeta (€)</label>
                              <input
                                type="number"
                                value={editForm.gorjeta}
                                onChange={e => setEditForm(f => ({ ...f, gorjeta: e.target.value }))}
                                placeholder="0"
                                min="0" step="0.50"
                                className="w-full border border-[#e8e4dc] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-verde bg-white"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[10px] font-medium text-ink-secondary mb-1 uppercase tracking-wide">Estado</label>
                              <select
                                value={editForm.estado}
                                onChange={e => setEditForm(f => ({ ...f, estado: e.target.value }))}
                                className="w-full border border-[#e8e4dc] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-verde bg-white"
                              >
                                <option value="concluido">Concluído</option>
                                <option value="pendente">Pendente</option>
                                <option value="desistencia">Desistência</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={saveEdit}
                              className="flex-1 btn-primary py-2 text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="px-4 py-2 rounded-lg border border-[#e8e4dc] text-sm text-ink-secondary hover:bg-[#f0eee8] transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between py-3 border-b border-[#f0eee8] last:border-0 table-row-hover px-1 -mx-1 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#f0eee8] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-verde" style={{ fontSize: '16px' }}>cut</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {r.cliente_nome || <span className="text-ink-secondary italic font-normal">Cliente anónimo</span>}
                          </p>
                          <p className="text-xs text-ink-secondary mt-0.5">
                            {formatHora(r.data_hora)}
                            {' · '}
                            {servicoNome}
                            {servicoMin ? ` · ${servicoMin} min` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-serif font-medium text-ink text-base">{fmt(r.valor)}</p>
                          {r.gorjeta > 0 && (
                            <p className="text-xs text-[#977c30] font-medium">+{fmt(r.gorjeta)} gorjeta</p>
                          )}
                        </div>
                        <EstadoBadge estado={r.estado} />
                      </div>

                      {/* Pending actions inline */}
                      {r.estado === 'pendente' && (
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={() => updateEstado(r.id, 'concluido')}
                            className="btn-inline text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium hover:bg-emerald-100 transition-colors"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check</span>
                            Confirmar
                          </button>
                          <button
                            onClick={() => updateEstado(r.id, 'desistencia')}
                            className="btn-inline text-xs bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded-md font-medium hover:bg-red-100 transition-colors"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>close</span>
                            Desistência
                          </button>
                        </div>
                      )}

                      {/* Edit + Delete */}
                      <div className="ml-1 flex items-center gap-1">
                        <button
                          onClick={() => startEdit(r)}
                          className="btn-inline w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f0eee8] text-ink-secondary hover:text-verde transition-colors"
                          title="Editar registo"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                        </button>
                        {confirmDeleteId === r.id ? (
                          <>
                            <button
                              onClick={() => deleteRegisto(r.id)}
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
                            onClick={() => setConfirmDeleteId(r.id)}
                            className="btn-inline w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-ink-secondary hover:text-red-600 transition-colors"
                            title="Eliminar registo"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
