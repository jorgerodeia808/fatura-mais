'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function RegistoPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleRegisto = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome_completo: nome },
      },
    })

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setError('Este email já está registado. Tenta fazer login.')
      } else {
        setError(`Erro: ${error.message}`)
      }
      setLoading(false)
      return
    }

    // Supabase pode exigir confirmação de email — verificar se sessão foi criada
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Email de confirmação enviado
      setError('')
      router.push('/registo/confirmar-email')
      return
    }

    router.push('/onboarding')
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
              A tua barbearia merece uma gestão profissional.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Começa hoje com 14 dias grátis. Sem cartão de crédito,
              sem compromissos — cancela quando quiseres.
            </p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3">
              {['14 dias de trial gratuito', 'Sem cartão de crédito', 'Cancela quando quiseres', 'Suporte incluído'].map(f => (
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

            <h2 className="font-serif font-bold text-2xl text-[#1c1c18] mb-1">Criar conta</h2>
            <p className="text-sm text-[#717971] mb-8">14 dias grátis, sem cartão</p>

            {/* Form */}
            <form onSubmit={handleRegisto} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1c1c18] mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input-field"
                  placeholder="João Silva"
                  required
                  autoComplete="name"
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
                <label className="block text-sm font-medium text-[#1c1c18] mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  minLength={6}
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
                    A criar conta...
                  </span>
                ) : (
                  'Criar conta'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[#717971] mt-6">
              Já tens conta?{' '}
              <Link href="/login" className="text-[#977c30] font-semibold hover:opacity-80 transition-opacity">
                Entrar
              </Link>
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
