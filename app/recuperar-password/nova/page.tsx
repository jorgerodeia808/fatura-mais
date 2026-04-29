'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

function NovaPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const isConvite = searchParams.get('tipo') === 'convite'
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('As passwords não coincidem.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Erro ao atualizar a password. O link pode ter expirado — pede um novo.')
      setLoading(false)
      return
    }

    router.push(isConvite ? '/onboarding' : '/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2">
        <div className="flex flex-col justify-between bg-verde text-white p-12 min-h-screen w-full">
          <div>
            <Image src="/images/Logo_F_.png" alt="Fatura+" width={44} height={44} />
            <h1 className="font-serif italic font-bold text-3xl text-white mt-4">
              Fatura<span className="text-dourado">+</span>
            </h1>
          </div>
          <div>
            <p className="font-serif font-bold text-4xl text-white leading-snug mb-4">
              Define a tua nova password.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Escolhe uma password segura para proteger a tua conta.
            </p>
          </div>
          <div className="relative h-24">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute bottom-4 right-8 w-16 h-16 bg-dourado/20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2">
        <div className="flex items-center justify-center px-6 py-12 min-h-screen bg-fundo">
          <div className="w-full max-w-sm">
            <div className="lg:hidden text-center mb-8">
              <Image src="/images/Logo_F_.png" alt="Fatura+" width={56} height={56} className="mx-auto mb-3" />
              <h1 className="font-serif italic font-bold text-2xl text-verde">
                Fatura<span className="text-dourado">+</span>
              </h1>
            </div>

            <h2 className="font-serif font-bold text-2xl text-ink mb-1">{isConvite ? 'Cria a tua password' : 'Nova password'}</h2>
            <p className="text-sm text-ink-secondary mb-8">{isConvite ? 'Define a tua password para acederes à plataforma.' : 'Escolhe uma password com pelo menos 6 caracteres.'}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Nova password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Confirmar password</label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="input-field"
                  placeholder="Repete a password"
                  required
                  autoComplete="new-password"
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
                    A guardar...
                  </span>
                ) : (
                  'Guardar nova password'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-ink-secondary mt-6">
              Link expirado?{' '}
              <Link href="/recuperar-password" className="text-dourado font-semibold hover:opacity-80 transition-opacity">
                Pedir novo link
              </Link>
            </p>

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

export default function NovaPasswordPage() {
  return (
    <Suspense>
      <NovaPasswordContent />
    </Suspense>
  )
}
