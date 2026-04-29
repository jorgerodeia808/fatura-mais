'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const FP_PRIMARY = '#1e3a5f'
const FP_ACCENT = '#c9a84c'

const fmt = (v: number) =>
  v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })

interface Objetivo {
  id: string
  nome: string
  valor_objetivo: number
  valor_atual: number
  data_limite: string | null
  ativo: boolean
  criado_em: string
}

interface FormState {
  nome: string
  valor_objetivo: string
  data_limite: string
}

const emptyForm = (): FormState => ({
  nome: '',
  valor_objetivo: '',
  data_limite: '',
})

export default function ObjetivosPage() {
  const supabase = createClient()
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Objetivo | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [depositModal, setDepositModal] = useState<Objetivo | null>(null)
  const [depositValor, setDepositValor] = useState('')
  const [depositSaving, setDepositSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('fp_objetivos')
      .select('*')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })

    setObjetivos((data as Objetivo[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => { setEditando(null); setForm(emptyForm()); setModal(true) }
  const openEdit = (o: Objetivo) => {
    setEditando(o)
    setForm({
      nome: o.nome,
      valor_objetivo: String(o.valor_objetivo),
      data_limite: o.data_limite ?? '',
    })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.nome.trim() || !form.valor_objetivo) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      nome: form.nome.trim(),
      valor_objetivo: parseFloat(form.valor_objetivo),
      data_limite: form.data_limite || null,
      ativo: true,
    }

    if (editando) {
      await supabase.from('fp_objetivos').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('fp_objetivos').insert({ ...payload, valor_atual: 0 })
    }
    setSaving(false)
    setModal(false)
    fetchData()
  }

  const handleDeposit = async () => {
    if (!depositModal || !depositValor) return
    setDepositSaving(true)
    const novo = Math.min(
      depositModal.valor_atual + parseFloat(depositValor),
      depositModal.valor_objetivo
    )
    await supabase.from('fp_objetivos').update({ valor_atual: novo }).eq('id', depositModal.id)
    setDepositSaving(false)
    setDepositModal(null)
    setDepositValor('')
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('fp_objetivos').delete().eq('id', id)
    setConfirmDelete(null)
    fetchData()
  }

  const ativos = objetivos.filter(o => o.ativo && o.valor_atual < o.valor_objetivo)
  const concluidos = objetivos.filter(o => o.valor_atual >= o.valor_objetivo)
  const totalPoupado = objetivos.reduce((s, o) => s + o.valor_atual, 0)
  const totalObjetivo = objetivos.reduce((s, o) => s + o.valor_objetivo, 0)

  const ObjetivoCard = ({ o }: { o: Objetivo }) => {
    const pct = Math.min((o.valor_atual / o.valor_objetivo) * 100, 100)
    const concluido = o.valor_atual >= o.valor_objetivo
    const diasRestantes = o.data_limite
      ? Math.ceil((new Date(o.data_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 group relative">
        <div className="absolute top-3 right-3 hidden group-hover:flex gap-1">
          {!concluido && (
            <button
              onClick={() => { setDepositModal(o); setDepositValor('') }}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              title="Adicionar depósito"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: FP_ACCENT }}>add_circle</span>
            </button>
          )}
          <button onClick={() => openEdit(o)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '14px' }}>edit</span>
          </button>
          <button onClick={() => setConfirmDelete(o.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-red-400" style={{ fontSize: '14px' }}>delete</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: concluido ? '#16a34a18' : `${FP_PRIMARY}10` }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: concluido ? '#16a34a' : FP_PRIMARY }}>
              {concluido ? 'check_circle' : 'flag'}
            </span>
          </div>
          <div className="flex-1 min-w-0 pr-16">
            <p className="text-sm font-semibold text-slate-800 truncate">{o.nome}</p>
            {diasRestantes !== null && !concluido && (
              <p className="text-xs mt-0.5" style={{ color: diasRestantes <= 30 ? '#f59e0b' : '#94a3b8' }}>
                {diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Prazo ultrapassado'}
              </p>
            )}
            {concluido && (
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Objetivo atingido! 🎉</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: concluido ? '#16a34a' : FP_ACCENT }}
          />
        </div>

        {/* Values */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-400">Poupado</p>
            <p className="text-lg font-bold" style={{ color: concluido ? '#16a34a' : FP_PRIMARY }}>
              {fmt(o.valor_atual)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Objetivo</p>
            <p className="text-sm font-semibold text-slate-500">{fmt(o.valor_objetivo)}</p>
          </div>
        </div>

        {/* Add deposit button (visible on mobile) */}
        {!concluido && (
          <button
            onClick={() => { setDepositModal(o); setDepositValor('') }}
            className="mt-3 w-full py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 sm:hidden"
            style={{ background: `${FP_ACCENT}20`, color: FP_ACCENT }}
          >
            + Adicionar depósito
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FP_PRIMARY }}>Objetivos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Metas de poupança</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: FP_PRIMARY }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Novo objetivo
        </button>
      </div>

      {/* Summary */}
      {objetivos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Total poupado</p>
            <p className="text-lg font-bold" style={{ color: FP_PRIMARY }}>{fmt(totalPoupado)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Total em objetivos</p>
            <p className="text-lg font-bold text-slate-600">{fmt(totalObjetivo)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Em progresso</p>
            <p className="text-lg font-bold text-slate-600">{ativos.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Concluídos</p>
            <p className="text-lg font-bold text-emerald-600">{concluidos.length}</p>
          </div>
        </div>
      )}

      {/* Active goals */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-2/3 mb-4" />
              <div className="h-2.5 bg-slate-100 rounded w-full mb-3" />
              <div className="flex justify-between"><div className="h-6 bg-slate-100 rounded w-16" /><div className="h-4 bg-slate-100 rounded w-16" /></div>
            </div>
          ))}
        </div>
      ) : objetivos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-16 px-4 text-center">
          <span className="material-symbols-outlined text-slate-300 mb-3" style={{ fontSize: '48px' }}>flag</span>
          <p className="text-sm font-medium text-slate-600 mb-1">Sem objetivos definidos</p>
          <p className="text-xs text-slate-400 mb-4">Define uma meta de poupança — fundo de emergência, viagem, carro — e acompanha o teu progresso.</p>
          <button onClick={openAdd} className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: FP_PRIMARY }}>
            Criar primeiro objetivo
          </button>
        </div>
      ) : (
        <>
          {ativos.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Em progresso</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ativos.map(o => <ObjetivoCard key={o.id} o={o} />)}
              </div>
            </div>
          )}
          {concluidos.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Concluídos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {concluidos.map(o => <ObjetivoCard key={o.id} o={o} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-lg" style={{ color: FP_PRIMARY }}>
                {editando ? 'Editar objetivo' : 'Novo objetivo'}
              </h3>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome do objetivo *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  placeholder="Ex: Fundo de emergência"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor objetivo (€) *</label>
                <input
                  type="number"
                  value={form.valor_objetivo}
                  onChange={e => setForm(f => ({ ...f, valor_objetivo: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Data limite <span className="font-normal text-slate-400">(opcional)</span></label>
                <input
                  type="date"
                  value={form.data_limite}
                  onChange={e => setForm(f => ({ ...f, data_limite: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="px-5 py-4 flex gap-2 border-t border-slate-100">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.nome.trim() || !form.valor_objetivo}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: FP_PRIMARY }}
              >
                {saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDepositModal(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
              <h3 className="font-semibold text-lg" style={{ color: FP_PRIMARY }}>Adicionar depósito</h3>
              <p className="text-sm text-slate-500 mt-0.5">{depositModal.nome}</p>
            </div>
            <div className="px-5 py-4">
              <div className="flex justify-between text-xs text-slate-500 mb-3">
                <span>Poupado: <strong>{fmt(depositModal.valor_atual)}</strong></span>
                <span>Falta: <strong>{fmt(depositModal.valor_objetivo - depositModal.valor_atual)}</strong></span>
              </div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor a adicionar (€) *</label>
              <input
                type="number"
                value={depositValor}
                onChange={e => setDepositValor(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                placeholder="0.00"
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
            <div className="px-5 py-4 flex gap-2 border-t border-slate-100">
              <button onClick={() => setDepositModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Cancelar</button>
              <button
                onClick={handleDeposit}
                disabled={depositSaving || !depositValor}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: FP_ACCENT, color: FP_PRIMARY }}
              >
                {depositSaving ? 'A guardar...' : 'Depositar'}
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
            <h3 className="font-semibold text-slate-800 mb-1">Eliminar objetivo?</h3>
            <p className="text-sm text-slate-500 mb-5">Todo o progresso será perdido.</p>
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
