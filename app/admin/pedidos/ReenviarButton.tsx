'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReenviarButton({ email, nicho }: { email: string; nicho: string | null }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleReenviar = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/convidar-direto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nicho: nicho ?? 'barbeiro' }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Erro ao reenviar')
      return
    }

    setDone(true)
    setTimeout(() => { setDone(false); router.refresh() }, 3000)
  }

  if (done) {
    return <span className="text-xs text-green-600 font-medium">Reenviado!</span>
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleReenviar}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>forward_to_inbox</span>
        {loading ? 'A enviar...' : 'Reenviar'}
      </button>
    </div>
  )
}
