'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function PedirAcessoPage() {
  const [nomeBarbearia, setNomeBarbearia] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/pedido-acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_barbearia: nomeBarbearia,
          email,
          instagram: instagram || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Ocorreu um erro. Tenta novamente.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Ocorreu um erro. Verifica a tua ligação e tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#fcf9f3] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Image src="/images/Logo_F_.png" alt="Fatura+" width={64} height={64} className="mx-auto mb-4" />
            <p className="font-serif italic font-bold text-xl text-[#0e4324]">
              Fatura<span className="text-[#977c30]">+</span>
            </p>
          </div>

          <div
            className="bg-white rounded-2xl p-8 text-center"
            style={{ border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[#0e4324]" style={{ fontSize: '32px' }}>check_circle</span>
            </div>
            <h1 className="font-serif font-bold text-2xl text-[#1c1c18] mb-2">Pedido enviado!</h1>
            <p className="text-sm text-[#717971] leading-relaxed mb-6">
              Recebemos o teu pedido. Vamos entrar em contacto brevemente para configurar o teu acesso ao Fatura+.
            </p>
            <Link href="/login" className="text-sm text-[#977c30] font-semibold hover:opacity-80 transition-opacity">
              ← Voltar ao login
            </Link>
          </div>

          <p className="text-center text-2xs text-[#717971]/50 mt-6">
            © 2026 Fatura+ ·{' '}
            <Link href="/privacidade" className="hover:text-[#717971]/70">Privacidade</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcf9f3] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/images/Logo_F_.png" alt="Fatura+" width={64} height={64} className="mx-auto mb-4" />
          <p className="font-serif italic font-bold text-xl text-[#0e4324]">
            Fatura<span className="text-[#977c30]">+</span>
          </p>
        </div>

        <div
          className="bg-white rounded-2xl p-8"
          style={{ border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <h1 className="font-serif font-bold text-2xl text-[#1c1c18] mb-1">Pedir acesso</h1>
          <p className="text-sm text-[#717971] leading-relaxed mb-6">
            Preenche os teus dados e entraremos em contacto para configurar o teu acesso ao Fatura+.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1c1c18] mb-1.5">Nome da barbearia</label>
              <input
                type="text"
                value={nomeBarbearia}
                onChange={(e) => setNomeBarbearia(e.target.value)}
                className="input-field"
                placeholder="Ex: Barbearia do João"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1c1c18] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="o.teu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1c1c18] mb-1.5">
                Instagram <span className="text-[#717971] font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717971] text-sm select-none">@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
                  className="input-field pl-7"
                  placeholder="barbeariadojoao"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A enviar...
                </span>
              ) : (
                'Enviar pedido'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#717971] mt-6">
            Já tens conta?{' '}
            <Link href="/login" className="text-[#977c30] font-semibold hover:opacity-80 transition-opacity">
              Entrar
            </Link>
          </p>
        </div>

        <p className="text-center text-2xs text-[#717971]/50 mt-6">
          © 2026 Fatura+ ·{' '}
          <Link href="/privacidade" className="hover:text-[#717971]/70">Privacidade</Link>
          {' '}·{' '}
          <Link href="/termos" className="hover:text-[#717971]/70">Termos</Link>
        </p>
      </div>
    </div>
  )
}
