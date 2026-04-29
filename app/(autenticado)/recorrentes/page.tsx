'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const FP_PRIMARY = '#1e3a5f'

const fmt = (v: number) =>
  v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })

interface Recorrente {
  id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  dia_do_mes: number
  ativo: boolean
  categoria_id: string | null
  fp_categorias?: { nome: string; icone: string; cor: string } | null
}

interface Cat { id: string; nome: string; tipo: string; icone: string; cor: string }

interface FormState {
  tipo: 'receita' | 'despesa'
  descricao: string
  valor: string
  dia_do_mes: string
  categoria_id: string
}

const emptyForm = (): FormState => ({
  tipo: 'despesa',
  descricao: '',
  valor: '',
  dia_do_mes: '1',
  categoria_id: '',
})

export default function RecorrentesPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Recorrente[]>([])
  const [cats, setCats] = useState<Cat[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Recorrente | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: recs }, { data: catsData }] = await Promise.all([
      supabase
        .from('fp_recorrentes')
        .select('id, descricao, valor, tipo, dia_do_mes, ativo, categoria_id, fp_categorias(nome, icone, cor)')
        .eq('user_id', user.id)
        .order('dia_do_mes'),
      supabase
        .from('fp_categorias')
        .select('id, nome, tipo, icone, cor')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .eq('ativo', true)
        .order('ordem'),
    ])

    setItems((recs as unknown as Recorrente[]) ?? [])
    setCats((catsData as Cat[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => { setEditando(null); setForm(emptyForm()); setModal(true) }
  const openEdit = (r: Recorrente) => {
    setEditando(r)
    setForm({
      tipo: r.tipo,
      descricao: r.descricao,
      valor: String(r.valor),
      dia_do_mes: String(r.dia_do_mes),
      categoria_id: r.categoria_id ?? '',
    })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.descricao.trim() || !form.valor) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor),
      dia_do_mes: Math.min(31, Math.max(1, parseInt(form.dia_do_mes) || 1)),
      categoria_id: form.categoria_id || null,
      ativo: true,
    }

    if (editando) {
      await supabase.from('fp_recorrentes').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('fp_recorrentes').insert(payload)
    }
    setSaving(false)
    setModal(false)
    fetchData()
  }

  const handleToggle = async (r: Recorrente) => {
    await supabase.from('fp_recorrentes').update({ ativo: !r.ativo }).eq('id', r.id)
    setItems(prev => prev.map(i => i.id === r.id ? { ...i, ativo: !i.ativo } : i))
  }

  const handleDelete = async (id: string) => {
    await supabase.from('fp_recorrentes').delete().eq('id', id)
    setConfirmDelete(null)
    fetchData()
  }

  const totalReceitas = items.filter(r => r.ativo && r.tipo === 'receita').reduce((s, r) => s + r.valor, 0)
  const totalDespesas = items.filter(r => r.ativo && r.tipo === 'despesa').reduce((s, r) => s + r.valor, 0)
  const totalMensal = totalReceitas - totalDespesas
  const catsFiltradas = cats.filter(c => c.tipo === form.tipo)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FP_PRIMARY }}>Recorrentes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Pagamentos e recebimentos fixos mensais</p>
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
          { label: 'Receitas fixas', value: totalReceitas, color: '#16a34a' },
          { label: 'Despesas fixas', value: totalDespesas, color: '#dc2626' },
          { label: 'Saldo mensal', value: totalMensal, color: totalMensal >= 0 ? '#16a34a' : '#dc2626' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className="text-lg font-bold" style={{ color: c.color }}>{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Receitas section */}
      {['receita', 'despesa'].map(tipo => {
        const grupo = items.filter(r => r.tipo === tipo)
        if (grupo.length === 0) return null
        return (
          <div key={tipo} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: tipo === 'receita' ? '#16a34a' : '#dc2626' }}>
                {tipo === 'receita' ? 'arrow_upward' : 'arrow_downward'}
              </span>
              <h2 className="text-sm font-semibold text-slate-700">
                {tipo === 'receita' ? 'Receitas' : 'Despesas'}
              </h2>
              <span className="ml-auto text-xs text-slate-400">
                {fmt(grupo.filter(r => r.ativo).reduce((s, r) => s + r.valor, 0))}/mês
              </span>
            </div>
            {grupo.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center gap-3 px-5 py-3.5 group hover:bg-slate-50 transition-colors ${!r.ativo ? 'opacity-50' : ''} ${i < grupo.length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: tipo === 'receita' ? '#16a34a12' : '#dc262612' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: tipo === 'receita' ? '#16a34a' : '#dc2626' }}>
                    {r.fp_categorias?.icone ?? 'autorenew'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.descricao}</p>
                  <p className="text-xs text-slate-400">
                    Dia {r.dia_do_mes} de cada mês{r.fp_categorias ? ` · ${r.fp_categorias.nome}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: tipo === 'receita' ? '#16a34a' : '#dc2626' }}>
                    {tipo === 'receita' ? '+' : '-'}{fmt(r.valor)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(r)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                      title={r.ativo ? 'Desativar' : 'Ativar'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: r.ativo ? '#16a34a' : '#94a3b8' }}>
                        {r.ativo ? 'toggle_on' : 'toggle_off'}
                      </span>
                    </button>
                    <button
                      onClick={() => openEdit(r)}
                      className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>edit</span>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(r.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined text-red-400" style={{ fontSize: '15px' }}>delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-16 px-4 text-center">
          <span className="material-symbols-outlined text-slate-300 mb-3" style={{ fontSize: '48px' }}>autorenew</span>
          <p className="text-sm font-medium text-slate-600 mb-1">Sem recorrentes</p>
          <p className="text-xs text-slate-400 mb-4">
            Adiciona subscrições, salário, renda — tudo o que se repete mensalmente.
          </p>
          <button onClick={openAdd} className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: FP_PRIMARY }}>
            Adicionar primeiro
          </button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-lg" style={{ color: FP_PRIMARY }}>
                {editando ? 'Editar recorrente' : 'Novo recorrente'}
              </h3>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
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
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  placeholder={form.tipo === 'receita' ? 'Ex: Salário' : 'Ex: Netflix'}
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
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Dia do mês</label>
                  <input
                    type="number"
                    value={form.dia_do_mes}
                    onChange={e => setForm(f => ({ ...f, dia_do_mes: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    min="1"
                    max="31"
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
                  {catsFiltradas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="px-5 py-4 flex gap-2 border-t border-slate-100">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.descricao.trim() || !form.valor}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
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
            <h3 className="font-semibold text-slate-800 mb-1">Eliminar recorrente?</h3>
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
