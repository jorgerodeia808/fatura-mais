'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConvidarDiretoForm() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [nomeBarbearia, setNomeBarbearia] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/convidar-direto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nome_barbearia: nomeBarbearia }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Erro ao enviar convite')
      return
    }

    setSuccess(true)
    setEmail('')
    setNomeBarbearia('')
    setTimeout(() => {
      setSuccess(false)
      setOpen(false)
      router.refresh()
    }, 2000)
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0e4324] text-white text-sm font-semibold hover:bg-[#0a3318] transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
          Convidar cliente
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Convidar cliente diretamente</h2>
            <button
              onClick={() => { setOpen(false); setError(''); setSuccess(false) }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>
          </div>

          {success ? (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
              Convite enviado com sucesso!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Nome da barbearia</label>
                <input
                  type="text"
                  value={nomeBarbearia}
                  onChange={e => setNomeBarbearia(e.target.value)}
                  required
                  placeholder="Ex: Barbearia do João"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="cliente@email.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
                />
              </div>
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-[#0e4324] text-white text-sm font-semibold hover:bg-[#0a3318] transition-colors disabled:opacity-50"
                >
                  {loading ? 'A enviar...' : 'Enviar convite por email'}
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError('') }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
