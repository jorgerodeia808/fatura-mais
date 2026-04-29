'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const todosNichos = [
  { id: 'barbeiro', label: 'Barbearia', emoji: '✂️' },
  { id: 'nails', label: 'Estúdio de Unhas', emoji: '💅' },
  { id: 'lash', label: 'Estúdio de Pestanas', emoji: '👁️' },
  { id: 'tatuador', label: 'Estúdio de Tatuagem', emoji: '🎨' },
  { id: 'fp', label: 'Finanças Pessoais', emoji: '💰' },
]

const isFP = process.env.NEXT_PUBLIC_APP_TYPE === 'fp'
const FP_PRIMARY = '#1e3a5f'
const FP_ACCENT = '#c9a84c'

export default function PedirAcessoPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [nicho, setNicho] = useState(isFP ? 'fp' : '')
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
      <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ backgroundColor: isFP ? '#f0f4f8' : undefined }}>
        <div className="w-full max-w-md text-center">
          <Image src="/images/Logo_F_.png" alt="Fatura+" width={56} height={56} className="mx-auto mb-3" />
          <p className={`font-serif italic font-bold text-xl mb-8${isFP ? '' : ' text-verde'}`} style={isFP ? { color: FP_PRIMARY } : {}}>
            Fatura<span style={isFP ? { color: FP_ACCENT } : {}} className={isFP ? '' : 'text-dourado'}>+</span>
            {isFP && <span className="font-sans not-italic font-light mx-2" style={{ color: `${FP_PRIMARY}50` }}>| FP</span>}
          </p>
          <div className="card p-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: isFP ? `${FP_PRIMARY}15` : undefined }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '28px', color: isFP ? FP_PRIMARY : undefined }}
              >
                check_circle
              </span>
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
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ backgroundColor: isFP ? '#f0f4f8' : undefined }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/images/Logo_F_.png" alt="Fatura+" width={56} height={56} className="mx-auto mb-3" />
          <p className={`font-serif italic font-bold text-xl${isFP ? '' : ' text-verde'}`} style={isFP ? { color: FP_PRIMARY } : {}}>
            Fatura<span style={isFP ? { color: FP_ACCENT } : {}} className={isFP ? '' : 'text-dourado'}>+</span>
            {isFP && <span className="font-sans not-italic font-light mx-2" style={{ color: `${FP_PRIMARY}50` }}>| FP</span>}
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
              <label className="block text-sm font-medium text-ink mb-1.5">Área de interesse</label>
              <div className="grid grid-cols-2 gap-2">
                {todosNichos.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setNicho(n.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${
                      nicho === n.id
                        ? 'font-medium'
                        : 'border-black/10 text-ink-secondary hover:border-black/20'
                    }`}
                    style={nicho === n.id ? {
                      borderColor: isFP ? FP_PRIMARY : '#0e4324',
                      backgroundColor: isFP ? `${FP_PRIMARY}08` : '#0e432408',
                      color: isFP ? FP_PRIMARY : '#0e4324',
                    } : {}}
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
              className="w-full py-3 mt-2 rounded-lg font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed text-white"
              style={{ backgroundColor: isFP ? FP_PRIMARY : '#0e4324' }}
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
