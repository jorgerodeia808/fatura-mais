'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const nichos = [
  { id: 'barbeiro', label: 'Barbearia', emoji: '✂️' },
  { id: 'nails', label: 'Estúdio de Unhas', emoji: '💅' },
  { id: 'lash', label: 'Estúdio de Pestanas', emoji: '👁️' },
  { id: 'tatuador', label: 'Estúdio de Tatuagem', emoji: '🎨' },
]

export default function PedirAcessoPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [nicho, setNicho] = useState('')
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
        body: JSON.stringify({ nome, email, telefone, nicho }),
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
      <div className="min-h-screen bg-fundo flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <Image src="/images/Logo_F_.png" alt="Fatura+" width={56} height={56} className="mx-auto mb-3" />
          <p className="font-serif italic font-bold text-xl text-verde mb-8">
            Fatura<span className="text-dourado">+</span>
          </p>
          <div className="card p-8">
            <div className="w-14 h-14 rounded-2xl bg-verde/10 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-verde" style={{ fontSize: '28px' }}>check_circle</span>
            </div>
            <h1 className="font-serif font-bold text-2xl text-ink mb-2">Pedido enviado!</h1>
            <p className="text-sm text-ink-secondary leading-relaxed">
              Recebemos o teu pedido. Entraremos em contacto brevemente para configurar o teu acesso.
            </p>
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
    <div className="min-h-screen bg-fundo flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/images/Logo_F_.png" alt="Fatura+" width={56} height={56} className="mx-auto mb-3" />
          <p className="font-serif italic font-bold text-xl text-verde">
            Fatura<span className="text-dourado">+</span>
          </p>
        </div>

        <div className="card p-8">
          <h1 className="font-serif font-bold text-2xl text-ink mb-1">Pedir acesso</h1>
          <p className="text-sm text-ink-secondary leading-relaxed mb-6">
            Preenche os teus dados e entraremos em contacto para configurar tudo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input-field"
                placeholder="O teu nome"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
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
              <label className="block text-sm font-medium text-ink mb-1.5">Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="input-field"
                placeholder="+351 9XX XXX XXX"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Área de negócio</label>
              <div className="grid grid-cols-2 gap-2">
                {nichos.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setNicho(n.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${
                      nicho === n.id
                        ? 'border-verde bg-verde/5 text-verde font-medium'
                        : 'border-black/10 text-ink-secondary hover:border-black/20'
                    }`}
                  >
                    <span>{n.emoji}</span>
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !nicho}
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
              ) : 'Enviar pedido'}
            </button>
          </form>
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
