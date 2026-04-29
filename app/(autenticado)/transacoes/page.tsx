'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const FP_PRIMARY = '#1e3a5f'
const FP_ACCENT = '#c9a84c'

const fmt = (v: number) =>
  v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })

interface Tx {
  id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  data: string
  categoria_id: string | null
  notas: string | null
  fp_categorias?: { id: string; nome: string; icone: string; cor: string } | null
}

interface Cat {
  id: string
  nome: string
  tipo: string
  icone: string
  cor: string
}

const emptyForm = (): FormState => ({
  tipo: 'despesa',
  descricao: '',
  valor: '',
  data: new Date().toISOString().split('T')[0],
  categoria_id: '',
  notas: '',
})

interface FormState {
  tipo: 'receita' | 'despesa'
  descricao: string
  valor: string
  data: string
  categoria_id: string
  notas: string
}

export default function TransacoesPage() {
  const supabase = createClient()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [txs, setTxs] = useState<Tx[]>([])
  const [cats, setCats] = useState<Cat[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Tx | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const mesStr = `${ano}-${String(mes).padStart(2, '0')}`
    const [{ data: txData }, { data: catsData }] = await Promise.all([
      supabase
        .from('fp_transacoes')
        .select('id, descricao, valor, tipo, data, categoria_id, notas, fp_categorias(id, nome, icone, cor)')
        .eq('user_id', user.id)
        .gte('data', `${mesStr}-01`)
        .lte('data', `${mesStr}-31`)
        .order('data', { ascending: false }),
      supabase
        .from('fp_categorias')
        .select('id, nome, tipo, icone, cor')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .eq('ativo', true)
        .order('ordem'),
    ])

    setTxs((txData as unknown as Tx[]) ?? [])
    setCats((catsData as Cat[]) ?? [])
    setLoading(false)
  }, [supabase, ano, mes])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => { setEditando(null); setForm(emptyForm()); setModal(true) }
  const openEdit = (tx: Tx) => {
    setEditando(tx)
    setForm({
      tipo: tx.tipo,
      descricao: tx.descricao,
      valor: String(tx.valor),
      data: tx.data,
      categoria_id: tx.categoria_id ?? '',
      notas: tx.notas ?? '',
    })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.descricao.trim() || !form.valor || !form.data) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor),
      data: form.data,
      categoria_id: form.categoria_id || null,
      notas: form.notas.trim() || null,
    }

    if (editando) {
      await supabase.from('fp_transacoes').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('fp_transacoes').insert(payload)
    }
    setSaving(false)
    setModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('fp_transacoes').delete().eq('id', id)
    setConfirmDelete(null)
    fetchData()
  }

  const prevMes = () => {
    if (mes === 1) { setMes(12); setAno(a => a - 1) }
    else setMes(m => m - 1)
  }
  const nextMes = () => {
    const agora = new Date()
    if (ano > agora.getFullYear() || (ano === agora.getFullYear() && mes >= agora.getMonth() + 1)) return
    if (mes === 12) { setMes(1); setAno(a => a + 1) }
    else setMes(m => m + 1)
  }

  const totalReceitas = txs.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const totalDespesas = txs.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const resultado = totalReceitas - totalDespesas
  const txFiltradas = filtroTipo === 'todos' ? txs : txs.filter(t => t.tipo === filtroTipo)
  const mesLabel = new Date(ano, mes - 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
  const catsFiltradas = cats.filter(c => c.tipo === form.tipo)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FP_PRIMARY }}>Transações</h1>
          <div className="flex items-center gap-1 mt-1">
            <button onClick={prevMes} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            <p className="text-sm text-slate-500 capitalize min-w-[150px] text-center">{mesLabel}</p>
            <button onClick={nextMes} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: FP_PRIMARY }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Adicionar
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Receitas', value: totalReceitas, color: '#16a34a' },
          { label: 'Despesas', value: totalDespesas, color: '#dc2626' },
          { label: 'Resultado', value: resultado, color: resultado >= 0 ? '#16a34a' : '#dc2626' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className="text-lg font-bold" style={{ color: c.color }}>{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['todos', 'receita', 'despesa'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filtroTipo === t ? FP_PRIMARY : 'white',
              color: filtroTipo === t ? 'white' : '#64748b',
              border: `1px solid ${filtroTipo === t ? FP_PRIMARY : '#e2e8f0'}`,
            }}
          >
            {t === 'todos' ? 'Todos' : t === 'receita' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">{txFiltradas.length} registos</span>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                </div>
                <div className="h-4 bg-slate-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : txFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <span className="material-symbols-outlined text-slate-300 mb-3" style={{ fontSize: '48px' }}>receipt_long</span>
            <p className="text-sm font-medium text-slate-600 mb-1">Sem transações</p>
            <p className="text-xs text-slate-400 mb-4">
              {filtroTipo === 'todos' ? 'Não há transações para este período.' : `Sem ${filtroTipo}s neste período.`}
            </p>
            <button onClick={openAdd} className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: FP_PRIMARY }}>
              Adicionar transação
            </button>
          </div>
        ) : (
          txFiltradas.map((tx, i) => (
            <div
              key={tx.id}
              className={`flex items-center gap-3 px-5 py-3.5 group hover:bg-slate-50 transition-colors ${i < txFiltradas.length - 1 ? 'border-b border-slate-50' : ''}`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: tx.tipo === 'receita' ? '#16a34a12' : '#dc262612' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: tx.tipo === 'receita' ? '#16a34a' : '#dc2626' }}>
                  {tx.fp_categorias?.icone ?? (tx.tipo === 'receita' ? 'arrow_upward' : 'arrow_downward')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{tx.descricao}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-slate-400">
                    {new Date(tx.data + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                  </p>
                  {tx.fp_categorias && (
                    <span className="text-xs text-slate-400">· {tx.fp_categorias.nome}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold" style={{ color: tx.tipo === 'receita' ? '#16a34a' : '#dc2626' }}>
                  {tx.tipo === 'receita' ? '+' : '-'}{fmt(tx.valor)}
                </p>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button onClick={() => openEdit(tx)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Editar">
                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>edit</span>
                  </button>
                  <button onClick={() => setConfirmDelete(tx.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                    <span className="material-symbols-outlined text-red-400" style={{ fontSize: '15px' }}>delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-lg" style={{ color: FP_PRIMARY }}>
                {editando ? 'Editar transação' : 'Nova transação'}
              </h3>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Tipo toggle */}
              <div className="flex gap-2">
                {(['receita', 'despesa'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, tipo: t, categoria_id: '' }))}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: form.tipo === t ? (t === 'receita' ? '#16a34a' : '#dc2626') : '#f8fafc',
                      color: form.tipo === t ? 'white' : '#64748b',
                    }}
                  >
                    {t === 'receita' ? '↑ Receita' : '↓ Despesa'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição *</label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': FP_PRIMARY } as React.CSSProperties}
                  placeholder={form.tipo === 'receita' ? 'Ex: Salário de abril' : 'Ex: Supermercado'}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor (€) *</label>
                  <input
                    type="number"
                    value={form.valor}
                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Data *</label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
                <select
                  value={form.categoria_id}
                  onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
                >
                  <option value="">Sem categoria</option>
                  {catsFiltradas.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas</label>
                <input
                  type="text"
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="px-5 py-4 flex gap-2 border-t border-slate-100">
              <button
                onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.descricao.trim() || !form.valor}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: FP_PRIMARY }}
              >
                {saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl text-center">
            <span className="material-symbols-outlined text-red-400 mb-3" style={{ fontSize: '40px' }}>delete_forever</span>
            <h3 className="font-semibold text-slate-800 mb-1">Eliminar transação?</h3>
            <p className="text-sm text-slate-500 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
