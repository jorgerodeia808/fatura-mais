'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/recuperar-password/nova`,
    })

    if (error) {
      setError('Erro ao enviar email. Verifica o endereço e tenta novamente.')
      setLoading(false)
      return
    }

    setEnviado(true)
    setLoading(false)
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
              Recupera o acesso à tua conta.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Enviamos um link para o teu email para definires uma nova password.
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

            {enviado ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
                  <span className="material-symbols-outlined text-green-600" style={{ fontSize: '32px' }}>mark_email_read</span>
                </div>
                <h2 className="font-serif font-bold text-2xl text-ink mb-2">Email enviado</h2>
                <p className="text-sm text-ink-secondary mb-6">
                  Se o email <strong>{email}</strong> estiver registado, recebes um link para redefinir a password.
                  Verifica a caixa de entrada e a pasta de spam.
                </p>
                <Link href="/login" className="text-sm text-dourado font-semibold hover:opacity-80 transition-opacity">
                  ← Voltar ao login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="font-serif font-bold text-2xl text-ink mb-1">Esqueceste a password?</h2>
                <p className="text-sm text-ink-secondary mb-8">
                  Introduz o teu email e enviamos um link para definires uma nova password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                      'Enviar link de recuperação'
                    )}
                  </button>
                </form>

                <p className="text-center text-sm text-ink-secondary mt-6">
                  <Link href="/login" className="text-dourado font-semibold hover:opacity-80 transition-opacity">
                    ← Voltar ao login
                  </Link>
                </p>
              </>
            )}

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
