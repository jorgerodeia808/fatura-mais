'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Email não confirmado. Verifica a tua caixa de entrada e clica no link de confirmação.')
      } else if (error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('credentials')) {
        setError('Email ou password incorretos. Tenta novamente.')
      } else {
        setError(`Erro: ${error.message}`)
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand, desktop only */}
      <div className="hidden lg:flex lg:w-1/2">
        <div className="flex flex-col justify-between bg-[#0e4324] text-white p-12 min-h-screen w-full">
          {/* Top: Logo + brand */}
          <div>
            <Image src="/images/Logo_F_.png" alt="Fatura+" width={44} height={44} />
            <h1 className="font-serif italic font-bold text-3xl text-white mt-4">
              Fatura<span className="text-[#977c30]">+</span>
            </h1>
          </div>

          {/* Middle: Tagline */}
          <div>
            <p className="font-serif font-bold text-4xl text-white leading-snug mb-4">
              A gestão financeira da tua barbearia, simplificada.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Controla faturação, despesas e marcações num único lugar.
              Com conselheiro financeiro IA incluído.
            </p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3">
              {['Faturação em tempo real', 'Relatórios automáticos', 'Conselheiro IA', 'Marcações online'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                  <span className="material-symbols-outlined icon-filled text-[#977c30] text-[16px]">check_circle</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom: decoration circles */}
          <div className="relative h-24">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute bottom-4 right-8 w-16 h-16 bg-[#977c30]/20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2">
        <div className="flex items-center justify-center px-6 py-12 min-h-screen bg-[#fcf9f3]">
          <div className="w-full max-w-sm">
            {/* Mobile only: logo */}
            <div className="lg:hidden text-center mb-8">
              <Image src="/images/Logo_F_.png" alt="Fatura+" width={56} height={56} className="mx-auto mb-3" />
              <h1 className="font-serif italic font-bold text-2xl text-[#0e4324]">
                Fatura<span className="text-[#977c30]">+</span>
              </h1>
            </div>

            <h2 className="font-serif font-bold text-2xl text-[#1c1c18] mb-1">Bem-vindo de volta</h2>
            <p className="text-sm text-[#717971] mb-8">Entra na tua conta para continuar</p>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-medium text-[#1c1c18]">Password</label>
                  <a href="#" className="text-xs text-[#977c30] hover:opacity-80 transition-opacity">Esqueceste?</a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
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
                    A entrar...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[#717971] mt-6">
              Ainda não tens conta?{' '}
              <a
                href="https://wa.me/351XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#977c30] font-semibold hover:opacity-80 transition-opacity"
              >
                Falar connosco
              </a>
            </p>

            {/* Footer */}
            <p className="text-center text-2xs text-[#717971]/60 mt-8">
              © 2026 Fatura+ ·{' '}
              <Link href="/privacidade" className="hover:text-[#717971] transition-colors">Privacidade</Link>
              {' '}·{' '}
              <Link href="/termos" className="hover:text-[#717971] transition-colors">Termos</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
