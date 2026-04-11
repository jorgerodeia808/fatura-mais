'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function Logo() {
  return (
    <div className="w-20 h-20 rounded-2xl bg-verde flex items-center justify-center font-bold text-5xl text-dourado shadow-lg mx-auto">
      F
    </div>
  )
}

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
    <div className="min-h-screen bg-fundo flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-3xl font-bold text-verde mt-4">
            Fatura<span className="text-dourado">+</span>
          </h1>
          <p className="text-gray-500 mt-2">Cria a tua conta gratuitamente</p>
        </div>

        <div className="card">
          <form onSubmit={handleRegisto} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome completo
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
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
              className="w-full btn-dourado py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A criar conta...
                </>
              ) : (
                'Criar conta grátis'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tens conta?{' '}
            <Link href="/login" className="text-dourado font-semibold hover:text-dourado-escuro transition-colors">
              Entrar
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Ao registares, aceitas os nossos{' '}
          <a href="#" className="underline hover:text-gray-600">Termos de Serviço</a>
          {' '}e{' '}
          <a href="#" className="underline hover:text-gray-600">Política de Privacidade</a>
        </p>
      </div>
    </div>
  )
}
