'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConvidarButton({ pedidoId, email }: { pedidoId: string; email: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleConvidar = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/convidar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido_id: pedidoId, email }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erro ao enviar convite')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    router.refresh()
  }

  if (done) {
    return <span className="text-xs text-green-600 font-medium">Convite enviado!</span>
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleConvidar}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0e4324] text-white hover:bg-[#0a3318] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'A enviar...' : 'Enviar convite'}
      </button>
    </div>
  )
}
