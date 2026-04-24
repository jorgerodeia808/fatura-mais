'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function PlataformaErradaPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSairESair = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Image src="/images/Logo_F_.png" alt="Fatura+" width={64} height={64} className="mx-auto mb-4" />
          <p className="font-serif italic font-bold text-xl text-verde">
            Fatura<span className="text-dourado">+</span>
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-amber-500" style={{ fontSize: '32px' }}>
              swap_horiz
            </span>
          </div>

          <h1 className="font-serif font-bold text-2xl text-ink mb-2">
            Conta noutro sistema
          </h1>
          <p className="text-sm text-ink-secondary leading-relaxed mb-6">
            A tua conta está registada numa plataforma diferente desta.
            Termina a sessão e acede através do endereço correto.
          </p>

          <button
            onClick={handleSairESair}
            disabled={loading}
            className="btn-primary w-full mb-3"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
            {loading ? 'A terminar sessão...' : 'Terminar sessão'}
          </button>

          <p className="text-xs text-ink-secondary">
            Depois de terminar a sessão, acede ao endereço correto da tua conta.
          </p>
        </div>

        <p className="text-center text-2xs text-ink/40 mt-6">
          © 2026 Fatura+ · faturamais30@gmail.com
        </p>
      </div>
    </div>
  )
}
