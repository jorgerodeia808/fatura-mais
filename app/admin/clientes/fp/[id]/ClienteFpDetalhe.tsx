'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PerfilFP {
  id: string
  user_id: string
  plano: string | null
  criado_em: string
  subscricao_renovacao: string | null
}

const PLANOS = ['mensal', 'vitalicio', 'suspenso']

const planoBadge: Record<string, string> = {
  mensal: 'bg-[#0e4324]/10 text-[#0e4324] border border-[#0e4324]/20',
  vitalicio: 'bg-[#977c30]/15 text-[#7a6228] border border-[#977c30]/30',
  suspenso: 'bg-red-50 text-red-700 border border-red-200',
}

export default function ClienteFpDetalhe({ perfil, email }: { perfil: PerfilFP; email: string }) {
  const router = useRouter()
  const [planoSelecionado, setPlanoSelecionado] = useState(perfil.plano ?? 'suspenso')
  const [metodo, setMetodo] = useState('transferencia')
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 3500)
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const diasRenovacao = perfil.subscricao_renovacao
    ? Math.ceil((new Date(perfil.subscricao_renovacao).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const handleAlterarPlano = async () => {
    setLoading('plano')
    const res = await fetch('/api/admin/alterar-plano', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fp_perfil_id: perfil.id, plano: planoSelecionado }),
    })
    setLoading(null)
    if (res.ok) { showToast('Plano guardado ✓'); router.refresh() }
    else { const d = await res.json(); showToast(d.error ?? 'Erro ao guardar', 'error') }
  }

  const handleRenovar = async () => {
    setLoading('renovar')
    const res = await fetch('/api/admin/renovar-subscricao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fp_perfil_id: perfil.id, metodo }),
    })
    setLoading(null)
    if (res.ok) {
      const data = await res.json()
      const nova = new Date(data.nova_renovacao).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      showToast(`Subscrição renovada até ${nova} ✓`)
      router.refresh()
    } else {
      const d = await res.json(); showToast(d.error ?? 'Erro ao renovar', 'error')
    }
  }

  const handleEliminar = async () => {
    setLoading('eliminar')
    const res = await fetch('/api/admin/eliminar-utilizador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: perfil.user_id }),
    })
    setLoading(null)
    if (res.ok) { router.push('/admin/clientes'); router.refresh() }
    else { const d = await res.json(); showToast(d.error ?? 'Erro ao eliminar', 'error'); setConfirmarEliminar(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 text-white ${toastType === 'error' ? 'bg-red-600' : 'bg-[#0e4324]'}`}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/clientes" className="text-ink-secondary hover:text-ink transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
        </Link>
        <div>
          <h1 className="page-title">{email}</h1>
          <p className="text-sm text-ink-secondary mt-0.5">FP+ · Finanças Pessoais</p>
        </div>
        <span className={`ml-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${planoBadge[perfil.plano ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {perfil.plano ? perfil.plano.charAt(0).toUpperCase() + perfil.plano.slice(1) : '—'}
        </span>
      </div>

      {/* Info */}
      <div className="card">
        <h2 className="section-title mb-4">Informações</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-ink-secondary mb-0.5">Email</p><p className="font-medium">{email}</p></div>
          <div><p className="text-xs text-ink-secondary mb-0.5">Registado em</p><p className="font-medium">{formatDate(perfil.criado_em)}</p></div>
          {perfil.subscricao_renovacao && (
            <div>
              <p className="text-xs text-ink-secondary mb-0.5">Próxima renovação</p>
              <p className={`font-medium ${diasRenovacao !== null && diasRenovacao <= 5 ? 'text-amber-700' : diasRenovacao !== null && diasRenovacao <= 0 ? 'text-red-600' : ''}`}>
                {formatDate(perfil.subscricao_renovacao)}
                {diasRenovacao !== null && (
                  diasRenovacao <= 0
                    ? ` (expirou há ${Math.abs(diasRenovacao)}d)`
                    : ` (${diasRenovacao}d)`
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Gestão do plano */}
      <div className="card space-y-4">
        <h2 className="section-title">Plano</h2>
        <div className="grid grid-cols-3 gap-2">
          {PLANOS.map(p => (
            <button
              key={p}
              onClick={() => setPlanoSelecionado(p)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${planoSelecionado === p ? 'bg-[#0e4324] text-white border-[#0e4324]' : 'bg-white text-ink border-[#e8e4dc] hover:border-[#0e4324]/30'}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={handleAlterarPlano} disabled={loading === 'plano'} className="btn-primary disabled:opacity-50">
            {loading === 'plano' ? 'A guardar...' : 'Guardar plano'}
          </button>
        </div>
      </div>

      {/* Renovação */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Renovar subscrição</h2>
          <span className="text-xs font-semibold text-verde bg-verde/10 px-2.5 py-1 rounded-full">€12,99 / mês</span>
        </div>
        <p className="text-sm text-ink-secondary">
          Regista o pagamento e renova automaticamente por +30 dias.
          {perfil.subscricao_renovacao && ` Renovação atual: ${formatDate(perfil.subscricao_renovacao)}.`}
        </p>
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">Método de pagamento</label>
          <select value={metodo} onChange={e => setMetodo(e.target.value)}
            className="w-full border border-[#e8e4dc] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors">
            <option value="transferencia">Transferência</option>
            <option value="multibanco">Multibanco</option>
            <option value="mbway">MBWay</option>
            <option value="numerario">Numerário</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button onClick={handleRenovar} disabled={loading === 'renovar'} className="btn-primary disabled:opacity-50">
            {loading === 'renovar' ? 'A renovar...' : 'Confirmar pagamento e renovar'}
          </button>
        </div>
      </div>

      {/* Zona de perigo */}
      <div className="card border border-red-100 space-y-3">
        <h2 className="section-title text-red-700">Zona de perigo</h2>
        {!confirmarEliminar ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-secondary">Elimina permanentemente este utilizador e todos os seus dados.</p>
            <button onClick={() => setConfirmarEliminar(true)}
              className="text-sm font-medium text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
              Eliminar utilizador
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-red-700 font-medium">Tens a certeza? Esta ação é irreversível.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmarEliminar(false)}
                className="text-sm px-4 py-2 rounded-lg border border-[#e8e4dc] hover:bg-[#f7f4ee] transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminar} disabled={loading === 'eliminar'}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                {loading === 'eliminar' ? 'A eliminar...' : 'Confirmar eliminação'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
