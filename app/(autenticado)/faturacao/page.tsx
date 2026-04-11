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
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

// ── Badge de estado ────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    concluido: 'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    desistencia: 'bg-red-100 text-red-700',
  }
  const labels: Record<string, string> = {
    concluido: 'Concluído',
    pendente: 'Pendente',
    desistencia: 'Desistência',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[estado] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[estado] ?? estado}
    </span>
  )
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

  // ── Metrics ──────────────────────────────────────────────────────
  const today = new Date()
  const isToday = selectedDate.toDateString() === today.toDateString()
  const registosConcluidos = registos.filter(r => r.estado === 'concluido')
  const faturadoTotal = registosConcluidos.reduce((s, r) => s + r.valor, 0)
  const gorjetasTotal = registosConcluidos.reduce((s, r) => s + (r.gorjeta ?? 0), 0)
  const servicosCount = registosConcluidos.length

  const PILL_AMOUNTS = [1, 2, 5]

  if (loadingInit) {
    return (
      <div className="space-y-6">
        <Sk className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Sk className="h-24" /><Sk className="h-24" /><Sk className="h-24" />
        </div>
        <div className="flex gap-4">
          <Sk className="w-[340px] h-96 flex-shrink-0" />
          <Sk className="flex-1 h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0e4324]">Faturação</h1>
          <p className="text-gray-500 text-sm mt-0.5">Regista e acompanha os serviços prestados</p>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <button
            onClick={() => changeDate(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-[#0e4324] min-w-[140px] text-center">
            {isToday
              ? `Hoje, ${selectedDate.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : formatDataLabel(selectedDate)}
          </span>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: isToday ? 'Faturado hoje' : 'Faturado', value: fmt(faturadoTotal), icon: '💰', sub: `${servicosCount} serv.` },
          { label: isToday ? 'Gorjetas hoje' : 'Gorjetas', value: fmt(gorjetasTotal), icon: '⭐', sub: gorjetasTotal > 0 ? `média ${fmt(gorjetasTotal / Math.max(servicosCount, 1))}` : undefined },
          { label: isToday ? 'Serviços hoje' : 'Serviços', value: String(servicosCount), icon: '✂️', sub: `${registos.filter(r => r.estado === 'pendente').length} pendentes` },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{m.icon}</span>
              {m.sub && <span className="text-xs text-gray-400">{m.sub}</span>}
            </div>
            {loadingRegistos ? <Sk className="h-7 w-24 mb-1" /> : (
              <p className="text-2xl font-bold text-[#0e4324]">{m.value}</p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* ── LEFT: Form ─────────────────────────────────────────── */}
        <div className="w-full lg:w-[340px] lg:flex-shrink-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Form header */}
          <div className="bg-[#0e4324] px-5 py-4">
            <h2 className="text-white font-semibold">Novo serviço</h2>
            <p className="text-white/60 text-xs mt-0.5">Regista um serviço prestado</p>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Cliente */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nome do cliente (opcional)</label>
              <input
                type="text"
                value={clienteNome}
                onChange={e => setClienteNome(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e4324] focus:border-transparent text-sm text-gray-800 placeholder-gray-400"
                placeholder="Ex: João Silva"
              />
            </div>

            {/* Serviços */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Serviço *</label>
              {servicos.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
                  <a href="/configuracoes" className="text-[#977c30] underline">Configura serviços</a> primeiro
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
                        className={`text-left p-3 rounded-xl border-2 transition-all ${
                          active
                            ? 'border-[#0e4324] bg-[#f0f7f3]'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <p className={`text-xs font-semibold leading-tight ${active ? 'text-[#0e4324]' : 'text-gray-700'}`}>
                          {s.nome}
                        </p>
                        <p className={`text-sm font-bold mt-1 ${active ? 'text-[#0e4324]' : 'text-gray-800'}`}>
                          {fmt(s.preco)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.tempo_minutos} min</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Gorjeta */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Gorjeta {gorjetaTotal > 0 && <span className="text-[#977c30] font-semibold">+{fmt(gorjetaTotal)}</span>}
              </label>
              <div className="flex items-center gap-2 mb-2">
                {PILL_AMOUNTS.map(a => {
                  const active = gorjetaPill === a
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => { setGorjetaPill(active ? null : a); setGorjetaManual('') }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        active
                          ? 'bg-[#977c30] text-white border-[#977c30]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#977c30]'
                      }`}
                    >
                      +{a}€
                    </button>
                  )
                })}
                <input
                  type="number"
                  value={gorjetaManual}
                  onChange={e => { setGorjetaManual(e.target.value); setGorjetaPill(null) }}
                  placeholder="Outro"
                  min="0"
                  step="0.50"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#977c30] focus:border-transparent"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value as typeof estado)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e4324] text-sm text-gray-800"
              >
                <option value="concluido">✅ Concluído</option>
                <option value="pendente">⏳ Pendente</option>
                <option value="desistencia">❌ Desistência</option>
              </select>
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
              disabled={submitting || !selectedServico}
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
                  Registar serviço
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── RIGHT: Histórico ────────────────────────────────────── */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#0e4324] text-sm">
              Histórico — {isToday ? 'hoje' : selectedDate.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
            </h2>
            <span className="text-xs text-gray-400">{registos.length} registos</span>
          </div>

          {loadingRegistos ? (
            <div className="p-5 space-y-3">
              {[1,2,3].map(i => <Sk key={i} className="h-16 w-full" />)}
            </div>
          ) : registos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 bg-[#0e4324]/5 rounded-full flex items-center justify-center mb-3">
                <span className="text-3xl">✂️</span>
              </div>
              <p className="font-semibold text-[#0e4324] mb-1">
                {isToday ? 'Ainda sem serviços hoje' : 'Sem registos neste dia'}
              </p>
              <p className="text-sm text-gray-400 max-w-xs">
                {isToday
                  ? 'Usa o formulário ao lado para registar o primeiro serviço do dia.'
                  : 'Não foram registados serviços neste dia.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {registos.map(r => (
                <div key={r.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Time */}
                      <div className="flex-shrink-0 text-center">
                        <p className="text-sm font-bold text-[#0e4324]">{formatHora(r.data_hora)}</p>
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {r.cliente_nome || <span className="text-gray-400 italic">Cliente anónimo</span>}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {(r.servicos as { nome: string; tempo_minutos: number } | null)?.nome ?? 'Serviço removido'}
                          {(r.servicos as { nome: string; tempo_minutos: number } | null)?.tempo_minutos
                            ? ` · ${(r.servicos as { nome: string; tempo_minutos: number }).tempo_minutos} min`
                            : ''}
                        </p>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#0e4324]">{fmt(r.valor)}</span>
                        {r.gorjeta > 0 && (
                          <span className="text-xs text-[#977c30] ml-1.5">+{fmt(r.gorjeta)}</span>
                        )}
                      </div>
                      <EstadoBadge estado={r.estado} />
                    </div>
                  </div>

                  {/* Pending actions */}
                  {r.estado === 'pendente' && (
                    <div className="flex items-center gap-2 mt-3 pl-10">
                      <button
                        onClick={() => updateEstado(r.id, 'concluido')}
                        className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100 transition-colors"
                      >
                        ✓ Confirmar
                      </button>
                      <button
                        onClick={() => updateEstado(r.id, 'desistencia')}
                        className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition-colors"
                      >
                        ✕ Desistência
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
