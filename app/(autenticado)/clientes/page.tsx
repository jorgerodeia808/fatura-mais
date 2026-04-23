'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────
interface Cliente {
  id: string
  nome: string
  telemovel: string | null
  observacoes: string | null
  criado_em: string
  _visitas?: number
  _total_gasto?: number
  _ultima_visita?: string | null
}

interface VisitaItem {
  id: string
  data_hora: string
  valor: number
  gorjeta: number
  tipo: string | null
  estado: string
  servicos: { nome: string } | null
  produtos: { nome: string } | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f0eee8] rounded-lg ${className}`} />
}

function Avatar({ nome, size = 'md' }: { nome: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
  return (
    <div className={`${sizes[size]} rounded-full bg-verde/10 text-verde font-bold flex items-center justify-center flex-shrink-0`}>
      {initials || '?'}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function ClientesPage() {
  const supabase = createClient()

  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [visitas, setVisitas] = useState<VisitaItem[]>([])
  const [loadingVisitas, setLoadingVisitas] = useState(false)

  // Detalhe do cliente selecionado
  const [editNome, setEditNome] = useState('')
  const [editTelemovel, setEditTelemovel] = useState('')
  const [editObs, setEditObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  // Novo cliente
  const [showNovoForm, setShowNovoForm] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoTelemovel, setNovoTelemovel] = useState('')
  const [novoObs, setNovoObs] = useState('')
  const [criando, setCriando] = useState(false)

  // Eliminar
  const [confirmDelete, setConfirmDelete] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchClientes = useCallback(async (bid: string) => {
    const { data } = await supabase
      .from('clientes')
      .select('id, nome, telemovel, observacoes, criado_em')
      .eq('barbearia_id', bid)
      .order('nome')

    if (!data) { setClientes([]); return }

    // Enriquecer com métricas de faturação
    const { data: fatData } = await supabase
      .from('faturacao')
      .select('cliente_id, valor, gorjeta, estado, data_hora')
      .eq('barbearia_id', bid)
      .not('cliente_id', 'is', null)
      .eq('estado', 'concluido')

    const metricas: Record<string, { visitas: number; total: number; ultima: string }> = {}
    for (const f of fatData ?? []) {
      if (!f.cliente_id) continue
      if (!metricas[f.cliente_id]) metricas[f.cliente_id] = { visitas: 0, total: 0, ultima: f.data_hora }
      metricas[f.cliente_id].visitas++
      metricas[f.cliente_id].total += (f.valor ?? 0) + (f.gorjeta ?? 0)
      if (f.data_hora > metricas[f.cliente_id].ultima) metricas[f.cliente_id].ultima = f.data_hora
    }

    setClientes(data.map(c => ({
      ...c,
      _visitas: metricas[c.id]?.visitas ?? 0,
      _total_gasto: metricas[c.id]?.total ?? 0,
      _ultima_visita: metricas[c.id]?.ultima ?? null,
    })))
  }, [supabase])

  const fetchVisitas = useCallback(async (clienteId: string) => {
    setLoadingVisitas(true)
    const { data } = await supabase
      .from('faturacao')
      .select('id, data_hora, valor, gorjeta, tipo, estado, servicos(nome), produtos(nome)')
      .eq('cliente_id', clienteId)
      .order('data_hora', { ascending: false })
      .limit(50)
    setVisitas((data as unknown as VisitaItem[]) ?? [])
    setLoadingVisitas(false)
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: barb } = await supabase.from('barbearias').select('id').eq('user_id', user.id).single()
      if (!barb) { setLoading(false); return }
      setBarbeariaId(barb.id)
      await fetchClientes(barb.id)
      setLoading(false)
    }
    init()
  }, [supabase, fetchClientes])

  const selecionarCliente = useCallback((c: Cliente) => {
    setSelectedId(c.id)
    setEditNome(c.nome)
    setEditTelemovel(c.telemovel ?? '')
    setEditObs(c.observacoes ?? '')
    setConfirmDelete(false)
    fetchVisitas(c.id)
  }, [fetchVisitas])

  const guardarCliente = async () => {
    if (!selectedId || !barbeariaId) return
    const tel = editTelemovel.trim()
    if (tel && !/^\d{9}$/.test(tel)) {
      showToast('Telemóvel inválido. Usa 9 dígitos sem espaços (ex: 912345678).')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('clientes').update({
      nome: editNome.trim(),
      telemovel: tel || null,
      observacoes: editObs.trim() || null,
    }).eq('id', selectedId)
    setSaving(false)
    if (error) { showToast('Erro ao guardar.'); return }
    setClientes(prev => prev.map(c => c.id === selectedId
      ? { ...c, nome: editNome.trim(), telemovel: editTelemovel.trim() || null, observacoes: editObs.trim() || null }
      : c
    ))
    showToast('Cliente guardado ✓')
  }

  const eliminarCliente = async () => {
    if (!selectedId || !barbeariaId) return
    setSaving(true)
    await supabase.from('clientes').delete().eq('id', selectedId)
    setSaving(false)
    setClientes(prev => prev.filter(c => c.id !== selectedId))
    setSelectedId(null)
    setConfirmDelete(false)
    showToast('Cliente eliminado ✓')
  }

  const criarCliente = async () => {
    if (!barbeariaId || !novoNome.trim()) return
    const tel = novoTelemovel.trim()
    if (tel && !/^\d{9}$/.test(tel)) {
      showToast('Telemóvel inválido. Usa 9 dígitos sem espaços (ex: 912345678).')
      return
    }
    setCriando(true)
    const { data, error } = await supabase.from('clientes').insert({
      barbearia_id: barbeariaId,
      nome: novoNome.trim(),
      telemovel: tel || null,
      observacoes: novoObs.trim() || null,
    }).select().single()
    setCriando(false)
    if (error) {
      showToast(error.message.includes('unique') ? 'Já existe um cliente com esse telemóvel.' : 'Erro ao criar cliente.')
      return
    }
    const novo: Cliente = { ...data, _visitas: 0, _total_gasto: 0, _ultima_visita: null }
    setClientes(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
    setNovoNome(''); setNovoTelemovel(''); setNovoObs('')
    setShowNovoForm(false)
    showToast('Cliente criado ✓')
    selecionarCliente(novo)
  }

  const clientesFiltrados = clientes.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.nome.toLowerCase().includes(q) || (c.telemovel ?? '').includes(q)
  })

  const selectedCliente = clientes.find(c => c.id === selectedId)

  if (loading) {
    return (
      <div className="space-y-6">
        <Sk className="h-9 w-48" />
        <div className="flex gap-5">
          <Sk className="w-80 h-[600px] flex-shrink-0" />
          <Sk className="flex-1 h-[600px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-verde text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="text-sm text-ink-secondary mt-0.5">{clientes.length} clientes registados</p>
        </div>
        <button
          onClick={() => { setShowNovoForm(true); setSelectedId(null) }}
          className="btn-primary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
          Novo cliente
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ── Lista de clientes ─────────────────────────────────── */}
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Pesquisa */}
            <div className="p-4 border-b border-[#f0eee8]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary" style={{ fontSize: '18px' }}>search</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar por nome ou nº..."
                  className="input-field pl-9"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
              {clientesFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <span className="material-symbols-outlined text-ink-secondary mb-2" style={{ fontSize: '32px' }}>person_off</span>
                  <p className="text-sm text-ink-secondary">
                    {search ? 'Nenhum cliente encontrado.' : 'Ainda sem clientes.'}
                  </p>
                </div>
              ) : (
                clientesFiltrados.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selecionarCliente(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[#f0eee8] last:border-0 transition-colors ${
                      selectedId === c.id ? 'bg-verde/5' : 'hover:bg-[#f8f6f1]'
                    }`}
                  >
                    <Avatar nome={c.nome} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{c.nome}</p>
                      <p className="text-xs text-ink-secondary truncate">
                        {c.telemovel ?? <span className="italic">sem telemóvel</span>}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-ink">{c._visitas ?? 0} visitas</p>
                      {c._ultima_visita && (
                        <p className="text-[10px] text-ink-secondary">{formatData(c._ultima_visita)}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Detalhe / Novo cliente ────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Formulário novo cliente */}
          {showNovoForm && (
            <div className="card mb-5">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#f0eee8]">
                <span className="material-symbols-outlined text-verde" style={{ fontSize: '20px' }}>person_add</span>
                <h2 className="section-title">Novo Cliente</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Nome *</label>
                  <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} className="input-field" placeholder="Ex: João Silva" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Telemóvel</label>
                  <input type="tel" value={novoTelemovel} onChange={e => setNovoTelemovel(e.target.value)} className="input-field" placeholder="+351 912 345 678" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Observações</label>
                  <textarea value={novoObs} onChange={e => setNovoObs(e.target.value)} rows={2} className="input-field resize-none" placeholder="Ex: Alergia a produto X, prefere corte Y..." />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={criarCliente} disabled={criando || !novoNome.trim()} className="btn-primary flex-1 disabled:opacity-50">
                    {criando ? 'A criar...' : 'Criar cliente'}
                  </button>
                  <button onClick={() => setShowNovoForm(false)} className="px-4 py-2 rounded-lg border border-[#e8e4dc] text-sm text-ink-secondary hover:bg-[#f0eee8] transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Detalhe cliente selecionado */}
          {selectedCliente && !showNovoForm && (
            <>
              {/* Ficha */}
              <div className="card mb-5">
                <div className="flex items-start gap-4 mb-5 pb-4 border-b border-[#f0eee8]">
                  <Avatar nome={selectedCliente.nome} size="lg" />
                  <div className="flex-1">
                    <h2 className="font-serif font-semibold text-xl text-ink">{selectedCliente.nome}</h2>
                    <p className="text-sm text-ink-secondary mt-0.5">{selectedCliente.telemovel ?? 'Sem telemóvel'}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-ink-secondary">
                        <span className="font-semibold text-ink">{selectedCliente._visitas ?? 0}</span> visitas
                      </span>
                      <span className="text-xs text-ink-secondary">
                        <span className="font-semibold text-ink">{fmt(selectedCliente._total_gasto ?? 0)}</span> gastos
                      </span>
                      <span className="text-xs text-ink-secondary">
                        Cliente desde <span className="font-semibold text-ink">{formatData(selectedCliente.criado_em)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Nome</label>
                      <input type="text" value={editNome} onChange={e => setEditNome(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Telemóvel</label>
                      <input type="tel" value={editTelemovel} onChange={e => setEditTelemovel(e.target.value)} className="input-field" placeholder="Sem telemóvel" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Observações</label>
                    <textarea
                      value={editObs}
                      onChange={e => setEditObs(e.target.value)}
                      rows={3}
                      className="input-field resize-none"
                      placeholder="Ex: Prefere corte degradé, alergia a produto X..."
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={guardarCliente}
                      disabled={saving}
                      className="btn-primary disabled:opacity-50"
                    >
                      {saving ? 'A guardar...' : 'Guardar alterações'}
                    </button>
                    {confirmDelete ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600 font-medium">Tens a certeza?</span>
                        <button onClick={eliminarCliente} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-red-700 transition-colors">
                          Eliminar
                        </button>
                        <button onClick={() => setConfirmDelete(false)} className="text-xs text-ink-secondary hover:text-ink transition-colors">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                        Eliminar cliente
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Histórico de visitas */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="px-6 py-4 border-b border-[#f0eee8] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-verde" style={{ fontSize: '18px' }}>history</span>
                    <h3 className="section-title text-base">Histórico de visitas</h3>
                  </div>
                  <span className="text-xs text-ink-secondary bg-[#f0eee8] px-2.5 py-1 rounded-full">
                    {visitas.length} registos
                  </span>
                </div>

                {loadingVisitas ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map(i => <Sk key={i} className="h-14 w-full" />)}
                  </div>
                ) : visitas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-ink-secondary mb-2" style={{ fontSize: '28px' }}>receipt_long</span>
                    <p className="text-sm text-ink-secondary">Ainda sem visitas registadas.</p>
                  </div>
                ) : (
                  <div className="px-6">
                    {visitas.map(v => {
                      const nomeItem = v.tipo === 'produto'
                        ? (v.produtos as { nome: string } | null)?.nome ?? 'Produto removido'
                        : (v.servicos as { nome: string } | null)?.nome ?? 'Serviço removido'
                      return (
                        <div key={v.id} className="flex items-center justify-between py-3 border-b border-[#f0eee8] last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#f0eee8] flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-verde" style={{ fontSize: '16px' }}>
                                {v.tipo === 'produto' ? 'inventory_2' : 'cut'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-ink">{nomeItem}</p>
                              <p className="text-xs text-ink-secondary">
                                {formatData(v.data_hora)} · {formatHora(v.data_hora)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-serif font-medium text-ink">{fmt(v.valor)}</p>
                            {v.gorjeta > 0 && (
                              <p className="text-xs text-dourado">+{fmt(v.gorjeta)} gorjeta</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Estado vazio */}
          {!selectedCliente && !showNovoForm && (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-[#f0eee8] rounded-2xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-ink-secondary" style={{ fontSize: '32px' }}>person</span>
              </div>
              <p className="font-serif font-semibold text-ink text-lg mb-1">Seleciona um cliente</p>
              <p className="text-sm text-ink-secondary max-w-xs">
                Escolhe um cliente da lista para ver a ficha e o histórico, ou cria um novo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
