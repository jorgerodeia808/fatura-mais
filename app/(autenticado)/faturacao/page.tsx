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

interface Produto {
  id: string
  nome: string
  preco: number
}

interface ClienteCRM {
  id: string
  nome: string
  telemovel: string | null
}

interface RegistoItem {
  id: string
  cliente_nome: string | null
  cliente_id: string | null
  servico_id: string | null
  produto_id: string | null
  tipo: 'servico' | 'produto' | null
  valor: number
  gorjeta: number
  estado: 'concluido' | 'pendente' | 'desistencia'
  data_hora: string
  servicos: { nome: string; tempo_minutos: number } | null
  produtos: { nome: string } | null
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

function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f0eee8] rounded-lg ${className}`} />
}

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

  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clientesCRM, setClientesCRM] = useState<ClienteCRM[]>([])
  const [registos, setRegistos] = useState<RegistoItem[]>([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingRegistos, setLoadingRegistos] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Form state
  const [tipoRegisto, setTipoRegisto] = useState<'servico' | 'produto'>('servico')
  const [clienteQuery, setClienteQuery] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [showSugestoes, setShowSugestoes] = useState(false)
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [avisoDuplicado, setAvisoDuplicado] = useState('')
  const [estado, setEstado] = useState<'concluido' | 'pendente' | 'desistencia'>('concluido')
  const [successMsg, setSuccessMsg] = useState('')
  const [formError, setFormError] = useState('')

  const clienteInputRef = useRef<HTMLInputElement>(null)
  const sugestoesRef = useRef<HTMLDivElement>(null)

  const sugestoesFiltradas = clientesCRM.filter(c => {
    if (!clienteQuery.trim() || clienteQuery.trim().length < 1) return false
    const q = clienteQuery.toLowerCase()
    return c.nome.toLowerCase().includes(q) || (c.telemovel ?? '').includes(q)
  }).slice(0, 6)

  // ── Fetch registos ───────────────────────────────────────────────
  const fetchRegistos = useCallback(async (bid: string, date: Date) => {
    setLoadingRegistos(true)
    const { data } = await supabase
      .from('faturacao')
      .select('id, cliente_nome, cliente_id, servico_id, produto_id, tipo, valor, gorjeta, estado, data_hora, servicos(nome, tempo_minutos), produtos(nome)')
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
      const { data: barb } = await supabase.from('barbearias').select('id').eq('user_id', user.id).single()
      if (!barb) { setLoadingInit(false); return }
      setBarbeariaId(barb.id)

      const [{ data: servs }, { data: prods }, { data: clts }] = await Promise.all([
        supabase.from('servicos').select('id, nome, preco, tempo_minutos').eq('barbearia_id', barb.id).eq('ativo', true).order('nome'),
        supabase.from('produtos').select('id, nome, preco').eq('barbearia_id', barb.id).eq('ativo', true).order('nome'),
        supabase.from('clientes').select('id, nome, telemovel').eq('barbearia_id', barb.id).order('nome'),
      ])

      setServicos((servs as Servico[]) ?? [])
      setProdutos((prods as Produto[]) ?? [])
      setClientesCRM((clts as ClienteCRM[]) ?? [])
      await fetchRegistos(barb.id, new Date())
      setLoadingInit(false)
    }
    init()
  }, [supabase, fetchRegistos])

  // ── Realtime subscription ────────────────────────────────────────
  useEffect(() => {
    if (!barbeariaId) return
    if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current)
    const channel = supabase
      .channel(`faturacao-${barbeariaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faturacao', filter: `barbearia_id=eq.${barbeariaId}` },
        () => { fetchRegistos(barbeariaId, selectedDate) })
      .subscribe()
    subscriptionRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [barbeariaId, selectedDate, supabase, fetchRegistos])

  // ── Fechar sugestões ao clicar fora ─────────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sugestoesRef.current && !sugestoesRef.current.contains(e.target as Node) &&
          clienteInputRef.current && !clienteInputRef.current.contains(e.target as Node)) {
        setShowSugestoes(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Date navigation ──────────────────────────────────────────────
  const changeDate = (delta: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    if (d > new Date()) return
    setSelectedDate(d)
    if (barbeariaId) fetchRegistos(barbeariaId, d)
  }

  // ── Selecionar cliente CRM ───────────────────────────────────────
  const selecionarClienteCRM = (c: ClienteCRM) => {
    setClienteQuery(c.nome)
    setClienteId(c.id)
    setShowSugestoes(false)
  }

  const limparCliente = () => {
    setClienteQuery('')
    setClienteId(null)
    setShowSugestoes(false)
    clienteInputRef.current?.focus()
  }

  // ── Submit form ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const item = tipoRegisto === 'servico' ? selectedServico : selectedProduto
    if (!item) { setFormError(`Seleciona um ${tipoRegisto === 'servico' ? 'serviço' : 'produto'}.`); return }
    if (!barbeariaId) return
    setFormError('')
    setAvisoDuplicado('')
    setSubmitting(true)

    // Verificar duplicado de serviço para o mesmo cliente no mesmo dia
    if (tipoRegisto === 'servico' && clienteId) {
      const { data: dups } = await supabase.from('faturacao')
        .select('id')
        .eq('barbearia_id', barbeariaId)
        .eq('cliente_id', clienteId)
        .eq('tipo', 'servico')
        .gte('data_hora', startOfDay(selectedDate))
        .lte('data_hora', endOfDay(selectedDate))
      if (dups && dups.length > 0) {
        setAvisoDuplicado(`Atenção: este cliente já tem ${dups.length} serviço(s) registado(s) hoje. Registo guardado na mesma.`)
      }
    }

    const payload: Record<string, unknown> = {
      barbearia_id: barbeariaId,
      cliente_nome: clienteQuery.trim() || null,
      cliente_id: clienteId,
      tipo: tipoRegisto,
      valor: item.preco,
      gorjeta: 0,
      estado,
      data_hora: new Date().toISOString(),
    }
    if (tipoRegisto === 'servico') payload.servico_id = (item as Servico).id
    else payload.produto_id = (item as Produto).id

    const { error } = await supabase.from('faturacao').insert(payload)
    if (error) { setFormError('Erro ao registar. Tenta novamente.'); setSubmitting(false); return }

    // Reset form
    setClienteQuery('')
    setClienteId(null)
    setSelectedServico(null)
    setSelectedProduto(null)
    setEstado('concluido')
    setSuccessMsg(`${tipoRegisto === 'servico' ? 'Serviço' : 'Produto'} registado!`)
    setTimeout(() => setSuccessMsg(''), 4000)
    setSubmitting(false)

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
          <Sk className="w-[360px] h-[580px] flex-shrink-0" />
          <Sk className="flex-1 h-[580px]" />
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
          <p className="text-sm text-ink-secondary mt-0.5">Regista produtos e serviços · Serviços confirmados entram automaticamente pelas marcações</p>
        </div>
        <div className="flex items-center gap-3">
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
        <div className="metric-card metric-card-accent">
          <p className="metric-label mb-3">{isToday ? 'Receita do dia' : 'Receita faturada'}</p>
          {loadingRegistos ? <Sk className="h-9 w-28 mb-1" /> : (
            <p className="metric-value text-verde">{fmt(faturadoTotal)}</p>
          )}
          {gorjetasTotal > 0 && (
            <p className="text-xs text-[#977c30] font-medium mt-1">+{fmt(gorjetasTotal)} gorjetas</p>
          )}
        </div>
        <div className="metric-card">
          <p className="metric-label mb-3">{isToday ? 'Registos hoje' : 'Registos'}</p>
          {loadingRegistos ? <Sk className="h-9 w-16 mb-1" /> : (
            <p className="metric-value">{servicosCount}</p>
          )}
          <p className="text-xs text-ink-secondary mt-1">
            {registos.filter(r => r.estado === 'pendente').length} pendentes
          </p>
        </div>
        <div className="metric-card">
          <p className="metric-label mb-3">Ticket médio</p>
          {loadingRegistos ? <Sk className="h-9 w-24 mb-1" /> : (
            <p className="metric-value">{fmt(ticketMedio)}</p>
          )}
          <p className="text-xs text-ink-secondary mt-1">por registo concluído</p>
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

              {/* Toggle Serviço / Produto */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Tipo</label>
                <div className="flex rounded-lg overflow-hidden" style={{ border: '0.5px solid rgba(0,0,0,0.1)' }}>
                  {(['servico', 'produto'] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => { setTipoRegisto(t); setSelectedServico(null); setSelectedProduto(null); setAvisoDuplicado('') }}
                      className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                        tipoRegisto === t ? 'bg-verde text-white' : 'bg-white text-ink-secondary hover:bg-[#f0eee8]'
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{t === 'servico' ? 'cut' : 'inventory_2'}</span>
                      {t === 'servico' ? 'Serviço' : 'Produto'}
                    </button>
                  ))}
                </div>
                {tipoRegisto === 'servico' && (
                  <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>info</span>
                    Os serviços das marcações confirmadas entram automaticamente — evita duplicados.
                  </p>
                )}
              </div>

              {/* Cliente (autocomplete CRM) */}
              <div className="relative">
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                  Cliente (opcional)
                  {clienteId && (
                    <span className="ml-1.5 text-verde normal-case tracking-normal font-semibold">
                      · ficha CRM
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    ref={clienteInputRef}
                    type="text"
                    value={clienteQuery}
                    onChange={e => {
                      setClienteQuery(e.target.value)
                      setClienteId(null)
                      setShowSugestoes(true)
                    }}
                    onFocus={() => { if (clienteQuery.length > 0) setShowSugestoes(true) }}
                    className="input-field pr-8"
                    placeholder="Pesquisar cliente ou escrever nome..."
                  />
                  {clienteQuery && (
                    <button
                      type="button"
                      onClick={limparCliente}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                    </button>
                  )}
                </div>
                {showSugestoes && sugestoesFiltradas.length > 0 && (
                  <div
                    ref={sugestoesRef}
                    className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg overflow-hidden"
                    style={{ border: '0.5px solid rgba(0,0,0,0.1)' }}
                  >
                    {sugestoesFiltradas.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selecionarClienteCRM(c)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f0eee8] transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#0e4324]/10 text-[#0e4324] text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {c.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink">{c.nome}</p>
                          {c.telemovel && <p className="text-xs text-ink-secondary">{c.telemovel}</p>}
                        </div>
                        <span className="ml-auto text-[10px] text-verde font-medium">CRM</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Serviços */}
              {tipoRegisto === 'servico' && (
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Serviço *</label>
                  {servicos.length === 0 ? (
                    <div className="text-center py-5 text-xs text-ink-secondary border border-dashed border-black/10 rounded-lg">
                      <a href="/configuracoes" className="text-[#977c30] underline font-medium">Configura serviços</a> primeiro
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {servicos.map(s => {
                        const active = selectedServico?.id === s.id
                        return (
                          <button key={s.id} type="button" onClick={() => setSelectedServico(active ? null : s)}
                            className={`p-3 rounded-lg text-left transition-all duration-150 btn-inline ${active ? 'bg-verde text-white shadow-sm' : 'bg-[#f0eee8] hover:bg-[#e8e5dd] text-ink border border-black/5'}`}>
                            <p className="text-sm font-medium leading-tight">{s.nome}</p>
                            <p className={`text-xs mt-1 font-serif font-semibold ${active ? 'text-white/80' : 'text-ink-secondary'}`}>{fmt(s.preco)}</p>
                            <p className={`text-xs mt-0.5 ${active ? 'text-white/60' : 'text-ink-secondary'}`}>{s.tempo_minutos} min</p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Produtos */}
              {tipoRegisto === 'produto' && (
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                    Produto *
                  </label>
                  {produtos.length === 0 ? (
                    <div className="text-center py-5 text-xs text-ink-secondary border border-dashed border-black/10 rounded-lg">
                      <a href="/configuracoes" className="text-[#977c30] underline font-medium">Configura produtos</a> primeiro
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {produtos.map(p => {
                        const active = selectedProduto?.id === p.id
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedProduto(active ? null : p)}
                            className={`p-3 rounded-lg text-left transition-all duration-150 btn-inline ${
                              active ? 'bg-verde text-white shadow-sm' : 'bg-[#f0eee8] hover:bg-[#e8e5dd] text-ink border border-black/5'
                            }`}
                          >
                            <p className="text-sm font-medium leading-tight">{p.nome}</p>
                            <p className={`text-xs mt-1 font-serif font-semibold ${active ? 'text-white/80' : 'text-ink-secondary'}`}>{fmt(p.preco)}</p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Aviso duplicado */}
              {avisoDuplicado && (
                <div className="flex items-start gap-2 text-amber-700 text-xs bg-amber-50 px-3 py-2 rounded-lg" style={{ border: '0.5px solid #fcd34d' }}>
                  <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '14px' }}>warning</span>
                  {avisoDuplicado}
                </div>
              )}

              {/* Estado */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Estado</label>
                <select value={estado} onChange={e => setEstado(e.target.value as typeof estado)} className="input-field">
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
                disabled={submitting || (tipoRegisto === 'servico' ? !selectedServico : !selectedProduto)}
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
                    Registar {tipoRegisto === 'servico' ? 'serviço' : 'produto'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT: Histórico ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                  <span className="material-symbols-outlined text-ink-secondary" style={{ fontSize: '28px' }}>receipt_long</span>
                </div>
                <p className="font-serif font-semibold text-ink text-lg mb-1">
                  {isToday ? 'Ainda sem registos hoje' : 'Sem registos neste dia'}
                </p>
                <p className="text-sm text-ink-secondary max-w-xs">
                  {isToday ? 'Usa o formulário ao lado para registar o primeiro serviço ou produto do dia.' : 'Não foram feitos registos neste dia.'}
                </p>
              </div>
            ) : (
              <div className="px-6">
                {registos.map(r => {
                  const isProduto = r.tipo === 'produto'
                  const itemNome = isProduto
                    ? (r.produtos as { nome: string } | null)?.nome ?? 'Produto removido'
                    : (r.servicos as { nome: string; tempo_minutos: number } | null)?.nome ?? 'Serviço removido'
                  const servicoMin = !isProduto ? (r.servicos as { nome: string; tempo_minutos: number } | null)?.tempo_minutos : null
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
                            {!isProduto && (
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
                            )}
                            {!isProduto && (
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
                            )}
                            <div className={isProduto ? 'col-span-2' : 'col-span-2'}>
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
                            <button onClick={saveEdit} className="flex-1 btn-primary py-2 text-sm">Guardar</button>
                            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-lg border border-[#e8e4dc] text-sm text-ink-secondary hover:bg-[#f0eee8] transition-colors">Cancelar</button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={r.id} className="flex items-center justify-between py-3 border-b border-[#f0eee8] last:border-0 table-row-hover px-1 -mx-1 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#f0eee8] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-verde" style={{ fontSize: '16px' }}>
                            {isProduto ? 'inventory_2' : 'cut'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {r.cliente_nome || <span className="text-ink-secondary italic font-normal">Cliente anónimo</span>}
                            {r.cliente_id && <span className="ml-1.5 text-[10px] text-verde font-medium bg-verde/10 px-1.5 py-0.5 rounded">CRM</span>}
                          </p>
                          <p className="text-xs text-ink-secondary mt-0.5">
                            {formatHora(r.data_hora)}
                            {' · '}
                            {itemNome}
                            {servicoMin ? ` · ${servicoMin} min` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-serif font-medium text-ink text-base">{fmt(r.valor)}</p>
                          {r.gorjeta > 0 && <p className="text-xs text-[#977c30] font-medium">+{fmt(r.gorjeta)} gorjeta</p>}
                        </div>
                        <EstadoBadge estado={r.estado} />
                      </div>

                      {r.estado === 'pendente' && (
                        <div className="flex items-center gap-2 ml-2">
                          <button onClick={() => updateEstado(r.id, 'concluido')} className="btn-inline text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium hover:bg-emerald-100 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check</span>
                            Confirmar
                          </button>
                          <button onClick={() => updateEstado(r.id, 'desistencia')} className="btn-inline text-xs bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded-md font-medium hover:bg-red-100 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>close</span>
                            Desistência
                          </button>
                        </div>
                      )}

                      <div className="ml-1 flex items-center gap-1">
                        <button onClick={() => startEdit(r)} className="btn-inline w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f0eee8] text-ink-secondary hover:text-verde transition-colors" title="Editar registo">
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                        </button>
                        {confirmDeleteId === r.id ? (
                          <>
                            <button onClick={() => deleteRegisto(r.id)} className="btn-inline text-xs bg-red-600 text-white px-2 py-1 rounded-md font-medium hover:bg-red-700 transition-colors">Eliminar</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="btn-inline text-xs text-ink-secondary hover:text-ink px-1.5 py-1 rounded-md transition-colors">Cancelar</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(r.id)} className="btn-inline w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-ink-secondary hover:text-red-600 transition-colors" title="Eliminar registo">
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
