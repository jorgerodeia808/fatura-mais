'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Barbearia {
  id: string
  nome: string
  plano: string | null
  trial_termina_em: string | null
  criado_em: string
  valor_pago_total: number | null
  metodo_pagamento: string | null
  indicado_por: string | null
  notas: string | null
  num_barbeiros: number | null
  hora_abertura: string | null
  hora_fecho: string | null
  dias_trabalho_mes: number | null
  user_id: string
}

interface Pagamento {
  id: string
  valor: number
  metodo: string
  data: string
  notas: string | null
  criado_em: string
}

const PLANOS = ['trial', 'mensal', 'vitalicio', 'suspenso']

const planoBadge: Record<string, string> = {
  trial: 'bg-[#977c30]/10 text-[#977c30] border border-[#977c30]/20',
  mensal: 'bg-[#0e4324]/10 text-[#0e4324] border border-[#0e4324]/20',
  vitalicio: 'bg-[#977c30]/15 text-[#7a6228] border border-[#977c30]/30',
  suspenso: 'bg-red-50 text-red-700 border border-red-200',
}

export default function ClienteDetalhe({ barbearia, email, pagamentos }: { barbearia: Barbearia; email: string; pagamentos: Pagamento[] }) {
  const router = useRouter()
  const [planoSelecionado, setPlanoSelecionado] = useState(barbearia.plano ?? 'trial')
  const [notas, setNotas] = useState(barbearia.notas ?? '')
  const [diasExtensao, setDiasExtensao] = useState('7')
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3500)
  }

  const handleAlterarPlano = async () => {
    setLoading('plano')
    const res = await fetch('/api/admin/alterar-plano', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barbearia_id: barbearia.id, plano: planoSelecionado, notas }),
    })
    setLoading(null)
    if (res.ok) {
      showToast('Plano e notas guardados ✓')
      router.refresh()
    } else {
      const data = await res.json()
      showToast(data.error ?? 'Erro ao guardar', 'error')
    }
  }

  const handleEstenderTrial = async () => {
    const dias = parseInt(diasExtensao)
    if (!dias || dias < 1) { showToast('Introduz um número de dias válido', 'error'); return }
    setLoading('trial')
    const res = await fetch('/api/admin/estender-trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barbearia_id: barbearia.id, dias }),
    })
    setLoading(null)
    if (res.ok) {
      const data = await res.json()
      const novaData = new Date(data.nova_data).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      showToast(`Trial estendido até ${novaData} ✓`)
      router.refresh()
    } else {
      const data = await res.json()
      showToast(data.error ?? 'Erro ao estender trial', 'error')
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const trialDias = barbearia.trial_termina_em
    ? Math.ceil((new Date(barbearia.trial_termina_em).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

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
          <h1 className="page-title">{barbearia.nome}</h1>
          <p className="text-sm text-ink-secondary mt-0.5">{email}</p>
        </div>
        <span className={`ml-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${planoBadge[barbearia.plano ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
          {barbearia.plano ?? '—'}
        </span>
      </div>

      {/* Info geral */}
      <div className="card">
        <h2 className="section-title mb-4">Informações</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-ink-secondary mb-0.5">Email</p><p className="font-medium">{email}</p></div>
          <div><p className="text-xs text-ink-secondary mb-0.5">Registado em</p><p className="font-medium">{formatDate(barbearia.criado_em)}</p></div>
          <div><p className="text-xs text-ink-secondary mb-0.5">Nº de barbeiros</p><p className="font-medium">{barbearia.num_barbeiros ?? '—'}</p></div>
          <div><p className="text-xs text-ink-secondary mb-0.5">Horário</p><p className="font-medium">{barbearia.hora_abertura ?? '—'} – {barbearia.hora_fecho ?? '—'}</p></div>
          <div><p className="text-xs text-ink-secondary mb-0.5">Dias trabalho/mês</p><p className="font-medium">{barbearia.dias_trabalho_mes ?? '—'}</p></div>
          <div><p className="text-xs text-ink-secondary mb-0.5">Total pago</p><p className="font-medium text-verde">{barbearia.valor_pago_total != null ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(barbearia.valor_pago_total) : '—'}</p></div>
          <div><p className="text-xs text-ink-secondary mb-0.5">Trial termina</p>
            <p className={`font-medium ${trialDias !== null && trialDias <= 0 ? 'text-red-600' : trialDias !== null && trialDias <= 3 ? 'text-[#977c30]' : ''}`}>
              {formatDate(barbearia.trial_termina_em)}{trialDias !== null && ` (${trialDias}d)`}
            </p>
          </div>
          <div><p className="text-xs text-ink-secondary mb-0.5">Indicado por</p><p className="font-medium">{barbearia.indicado_por ?? '—'}</p></div>
        </div>
      </div>

      {/* Gestão do plano */}
      <div className="card space-y-4">
        <h2 className="section-title">Gestão do plano</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">Notas internas</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
            placeholder="Notas sobre este cliente (visível apenas para admins)"
            className="w-full border border-[#e8e4dc] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] resize-none transition-colors"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAlterarPlano}
            disabled={loading === 'plano'}
            className="btn-primary disabled:opacity-50"
          >
            {loading === 'plano' ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </div>

      {/* Extensão de trial */}
      <div className="card space-y-4">
        <h2 className="section-title">Extensão de trial</h2>
        <p className="text-sm text-ink-secondary">Adiciona dias ao trial deste cliente. Se o trial já expirou, a extensão começa a partir de hoje.</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-ink-secondary mb-1">Dias a adicionar</label>
            <input
              type="number"
              value={diasExtensao}
              onChange={e => setDiasExtensao(e.target.value)}
              min="1"
              max="365"
              className="w-full border border-[#e8e4dc] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            />
          </div>
          <button
            onClick={handleEstenderTrial}
            disabled={loading === 'trial'}
            className="btn-secondary disabled:opacity-50 whitespace-nowrap"
          >
            {loading === 'trial' ? 'A estender...' : 'Estender trial'}
          </button>
        </div>
      </div>

      {/* Pagamentos */}
      {pagamentos.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-[#e8e4dc]">
            <h2 className="section-title">Pagamentos recentes</h2>
          </div>
          <div className="divide-y divide-[#f0ece4]">
            {pagamentos.map(p => (
              <div key={p.id} className="px-6 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-verde">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(p.valor)}</p>
                  <p className="text-xs text-ink-secondary">{p.metodo} · {formatDate(p.data)}</p>
                  {p.notas && <p className="text-xs text-ink-secondary mt-0.5">{p.notas}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
