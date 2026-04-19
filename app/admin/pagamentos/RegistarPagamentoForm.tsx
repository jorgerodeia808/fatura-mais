'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Barbearia {
  id: string
  nome: string
}

export default function RegistarPagamentoForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [barbearias, setBarbearias] = useState<Barbearia[]>([])
  const [form, setForm] = useState({
    barbearia_id: '',
    valor: '',
    metodo: 'mbway',
    tipo: 'mensal',
    notas: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('barbearias')
      .select('id, nome')
      .order('nome')
      .then(({ data }) => setBarbearias((data as Barbearia[]) ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: dbError } = await supabase.from('pagamentos_recebidos').insert({
      barbearia_id: form.barbearia_id,
      valor: parseFloat(form.valor),
      metodo: form.metodo,
      tipo: form.tipo,
      notas: form.notas.trim() || null,
    })

    setLoading(false)
    if (dbError) {
      setError(dbError.message)
      return
    }

    setSuccess(true)
    setForm({ barbearia_id: '', valor: '', metodo: 'mbway', tipo: 'mensal', notas: '' })
    setTimeout(() => {
      setSuccess(false)
      setOpen(false)
      onSuccess()
    }, 1200)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-[#0e4324] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#0e4324]/90 transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
        Registar pagamento
      </button>
    )
  }

  return (
    <div className="card p-6 border-2 border-[#0e4324]/20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif font-bold text-lg text-verde">Registar novo pagamento</h2>
        <button
          onClick={() => setOpen(false)}
          className="text-ink-secondary hover:text-ink transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1.5">Barbearia *</label>
          <select
            required
            value={form.barbearia_id}
            onChange={e => setForm(f => ({ ...f, barbearia_id: e.target.value }))}
            className="input w-full"
          >
            <option value="">Selecionar barbearia...</option>
            {barbearias.map(b => (
              <option key={b.id} value={b.id}>{b.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">Valor (€) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="14.99"
              value={form.valor}
              onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">Método *</label>
            <select
              value={form.metodo}
              onChange={e => setForm(f => ({ ...f, metodo: e.target.value }))}
              className="input w-full"
            >
              <option value="mbway">MBWay</option>
              <option value="transferencia">Transferência</option>
              <option value="multibanco">Multibanco</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1.5">Tipo *</label>
          <select
            value={form.tipo}
            onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
            className="input w-full"
          >
            <option value="mensal">Mensal</option>
            <option value="vitalicio">Vitalício</option>
            <option value="trial_ext">Extensão de Trial</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1.5">Notas</label>
          <input
            type="text"
            placeholder="Opcional"
            value={form.notas}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
            className="input w-full"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">Pagamento registado com sucesso!</p>}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading} className="btn-primary px-5 py-2 text-sm">
            {loading ? 'A guardar...' : 'Guardar pagamento'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary px-5 py-2 text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
