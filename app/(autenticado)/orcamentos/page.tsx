'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const FP_PRIMARY = '#1e3a5f'
const FP_ACCENT = '#c9a84c'

const fmt = (v: number) =>
  v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })

interface Orcamento {
  id: string
  categoria_id: string
  valor_limite: number
  mes: string
  fp_categorias?: { nome: string; icone: string; cor: string } | null
}

interface Cat { id: string; nome: string; tipo: string; icone: string; cor: string }

interface OrcamentoComGasto extends Orcamento {
  gasto: number
}

export default function OrcamentosPage() {
  const supabase = createClient()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [orcamentos, setOrcamentos] = useState<OrcamentoComGasto[]>([])
  const [cats, setCats] = useState<Cat[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Orcamento | null>(null)
  const [formCatId, setFormCatId] = useState('')
  const [formLimite, setFormLimite] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const mesStr = `${ano}-${String(mes).padStart(2, '0')}`
    const mesStart = `${mesStr}-01`
    const mesEnd = new Date(ano, mes, 0).toISOString().split('T')[0]

    const [{ data: buds }, { data: catsData }] = await Promise.all([
      supabase
        .from('fp_orcamentos')
        .select('id, categoria_id, valor_limite, mes, fp_categorias(nome, icone, cor)')
        .eq('user_id', user.id)
        .eq('mes', mesStr),
      supabase
        .from('fp_categorias')
        .select('id, nome, tipo, icone, cor')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .eq('ativo', true)
        .eq('tipo', 'despesa')
        .order('ordem'),
    ])

    const rawCats = (catsData as Cat[]) ?? []
    setCats(rawCats.filter((c, i, arr) => arr.findIndex(x => x.nome === c.nome && x.tipo === c.tipo) === i))

    if (!buds || buds.length === 0) {
      setOrcamentos([])
      setLoading(false)
      return
    }

    const catIds = buds.map(b => b.categoria_id).filter(Boolean)
    const { data: gastos } = await supabase
      .from('fp_transacoes')
      .select('categoria_id, valor')
      .eq('user_id', user.id)
      .eq('tipo', 'despesa')
      .gte('data', mesStart)
      .lte('data', mesEnd)
      .in('categoria_id', catIds)

    const gastoMap: Record<string, number> = {}
    ;(gastos ?? []).forEach(t => {
      gastoMap[t.categoria_id] = (gastoMap[t.categoria_id] ?? 0) + t.valor
    })

    setOrcamentos((buds as unknown as Orcamento[]).map(b => ({
      ...b,
      gasto: gastoMap[b.categoria_id] ?? 0,
    })))
    setLoading(false)
  }, [supabase, ano, mes])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => {
    setEditando(null)
    setFormCatId('')
    setFormLimite('')
    setModal(true)
  }
  const openEdit = (o: Orcamento) => {
    setEditando(o)
    setFormCatId(o.categoria_id)
    setFormLimite(String(o.valor_limite))
    setModal(true)
  }

  const handleSave = async () => {
    if (!formCatId || !formLimite) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const mesStr = `${ano}-${String(mes).padStart(2, '0')}`
    const payload = {
      user_id: user.id,
      categoria_id: formCatId,
      valor_limite: parseFloat(formLimite),
      mes: mesStr,
    }

    if (editando) {
      await supabase.from('fp_orcamentos').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('fp_orcamentos').upsert(payload, { onConflict: 'user_id,categoria_id,mes' })
    }
    setSaving(false)
    setModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('fp_orcamentos').delete().eq('id', id)
    setConfirmDelete(null)
    fetchData()
  }

  const prevMes = () => {
    if (mes === 1) { setMes(12); setAno(a => a - 1) } else setMes(m => m - 1)
  }
  const nextMes = () => {
    const agora = new Date()
    if (ano > agora.getFullYear() || (ano === agora.getFullYear() && mes >= agora.getMonth() + 1)) return
    if (mes === 12) { setMes(1); setAno(a => a + 1) } else setMes(m => m + 1)
  }

  const mesLabel = new Date(ano, mes - 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
  const totalLimite = orcamentos.reduce((s, o) => s + o.valor_limite, 0)
  const totalGasto = orcamentos.reduce((s, o) => s + o.gasto, 0)
  const catsComOrcamento = new Set(orcamentos.map(o => o.categoria_id))
  const catsDisponiveis = cats.filter(c => !catsComOrcamento.has(c.id) || editando?.categoria_id === c.id)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FP_PRIMARY }}>Orçamentos</h1>
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
          disabled={catsDisponiveis.length === 0}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Definir orçamento
        </button>
      </div>

      {/* Summary */}
      {orcamentos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Limite total</p>
            <p className="text-lg font-bold" style={{ color: FP_PRIMARY }}>{fmt(totalLimite)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Gasto</p>
            <p className="text-lg font-bold" style={{ color: totalGasto > totalLimite ? '#dc2626' : '#64748b' }}>{fmt(totalGasto)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Disponível</p>
            <p className="text-lg font-bold" style={{ color: totalLimite - totalGasto >= 0 ? '#16a34a' : '#dc2626' }}>
              {fmt(Math.max(0, totalLimite - totalGasto))}
            </p>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
              <div className="h-2 bg-slate-100 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-16 px-4 text-center">
          <span className="material-symbols-outlined text-slate-300 mb-3" style={{ fontSize: '48px' }}>pie_chart</span>
          <p className="text-sm font-medium text-slate-600 mb-1">Sem orçamentos para este mês</p>
          <p className="text-xs text-slate-400 mb-4">Define limites de despesa por categoria para controlares melhor os teus gastos.</p>
          <button onClick={openAdd} className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: FP_PRIMARY }}>
            Definir primeiro orçamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orcamentos.map(o => {
            const pct = Math.min((o.gasto / o.valor_limite) * 100, 100)
            const barColor = pct >= 100 ? '#dc2626' : pct >= 80 ? '#f59e0b' : '#16a34a'
            const cat = o.fp_categorias
            return (
              <div key={o.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 group relative">
                {/* Actions */}
                <div className="absolute top-3 right-3 hidden group-hover:flex gap-1">
                  <button onClick={() => openEdit(o)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '14px' }}>edit</span>
                  </button>
                  <button onClick={() => setConfirmDelete(o.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-red-400" style={{ fontSize: '14px' }}>delete</span>
                  </button>
                </div>

                {/* Category header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cat?.cor ? `${cat.cor}18` : '#64748b18' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: cat?.cor ?? '#64748b' }}>
                      {cat?.icone ?? 'category'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{cat?.nome ?? 'Sem categoria'}</p>
                    <p className="text-xs text-slate-400">
                      {pct >= 100 ? 'Limite atingido' : `${(100 - pct).toFixed(0)}% disponível`}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>

                {/* Values */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-400">Gasto</p>
                    <p className="text-sm font-bold" style={{ color: barColor }}>{fmt(o.gasto)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Limite</p>
                    <p className="text-sm font-bold text-slate-600">{fmt(o.valor_limite)}</p>
                  </div>
                </div>

                {/* Overspent warning */}
                {o.gasto > o.valor_limite && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600 font-medium">
                      Excedido em {fmt(o.gasto - o.valor_limite)}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-lg" style={{ color: FP_PRIMARY }}>
                {editando ? 'Editar orçamento' : 'Novo orçamento'}
              </h3>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria *</label>
                <select
                  value={formCatId}
                  onChange={e => setFormCatId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
                  disabled={!!editando}
                >
                  <option value="">Seleciona...</option>
                  {catsDisponiveis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Limite mensal (€) *</label>
                <input
                  type="number"
                  value={formLimite}
                  onChange={e => setFormLimite(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-400">
                Este orçamento aplica-se a <strong className="capitalize">{mesLabel}</strong>.
              </p>
            </div>
            <div className="px-5 py-4 flex gap-2 border-t border-slate-100">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving || !formCatId || !formLimite}
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
            <h3 className="font-semibold text-slate-800 mb-1">Remover orçamento?</h3>
            <p className="text-sm text-slate-500 mb-5">O limite desta categoria será removido.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
