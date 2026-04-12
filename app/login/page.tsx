'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

function Logo() {
  return (
    <Image src="/images/Logo_F_.png" alt="Fatura+" width={80} height={80} className="mx-auto" />
  )
}

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
    <div className="min-h-screen bg-fundo flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-3xl font-bold text-verde mt-4">
            Fatura<span className="text-dourado">+</span>
          </h1>
          <p className="text-gray-500 mt-2">Bem-vindo de volta</p>
        </div>

        <div className="card">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="#" className="text-sm text-dourado hover:text-dourado-escuro transition-colors">
                  Esqueceste?
                </a>
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
              className="w-full btn-primary py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A entrar...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Ainda não tens conta?{' '}
            <Link href="/registo" className="text-dourado font-semibold hover:text-dourado-escuro transition-colors">
              Registar grátis
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Ao entrar, aceitas os nossos{' '}
          <a href="#" className="underline hover:text-gray-600">Termos de Serviço</a>
        </p>
      </div>
    </div>
  )
}
