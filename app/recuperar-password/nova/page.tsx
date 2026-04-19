'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function NovaPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
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

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2">
        <div className="flex flex-col justify-between bg-[#0e4324] text-white p-12 min-h-screen w-full">
          <div>
            <Image src="/images/Logo_F_.png" alt="Fatura+" width={44} height={44} />
            <h1 className="font-serif italic font-bold text-3xl text-white mt-4">
              Fatura<span className="text-[#977c30]">+</span>
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
            <div className="absolute bottom-4 right-8 w-16 h-16 bg-[#977c30]/20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2">
        <div className="flex items-center justify-center px-6 py-12 min-h-screen bg-[#fcf9f3]">
          <div className="w-full max-w-sm">
            <div className="lg:hidden text-center mb-8">
              <Image src="/images/Logo_F_.png" alt="Fatura+" width={56} height={56} className="mx-auto mb-3" />
              <h1 className="font-serif italic font-bold text-2xl text-[#0e4324]">
                Fatura<span className="text-[#977c30]">+</span>
              </h1>
            </div>

            <h2 className="font-serif font-bold text-2xl text-[#1c1c18] mb-1">Nova password</h2>
            <p className="text-sm text-[#717971] mb-8">Escolhe uma password com pelo menos 6 caracteres.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1c1c18] mb-1.5">Nova password</label>
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
                <label className="block text-sm font-medium text-[#1c1c18] mb-1.5">Confirmar password</label>
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

            <p className="text-center text-sm text-[#717971] mt-6">
              Link expirado?{' '}
              <Link href="/recuperar-password" className="text-[#977c30] font-semibold hover:opacity-80 transition-opacity">
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
