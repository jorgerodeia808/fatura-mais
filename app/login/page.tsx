'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getNichoConfig } from '@/lib/nicho'
import NichoLogo from '@/components/NichoLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const nicho = getNichoConfig()
  const isSubdominio = !!process.env.NEXT_PUBLIC_NICHO

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const erro = params.get('erro')
    if (erro === 'link_expirado') setNotice('O link de acesso expirou. Pede ao administrador que reenvie o convite.')
    else if (erro === 'link_invalido') setNotice('O link de acesso é inválido. Pede ao administrador que reenvie o convite.')
    else if (erro === 'plataforma_errada') setNotice('A tua conta não pertence a esta plataforma. Acede pela plataforma correta.')
  }, [])

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

  const taglines: Record<string, { titulo: string; sub: string }> = {
    barbeiro: {
      titulo: 'A gestão financeira da tua barbearia, simplificada.',
      sub: 'Controla faturação, despesas e marcações num único lugar.',
    },
    nails: {
      titulo: 'A gestão do teu estúdio de unhas, simplificada.',
      sub: 'Faturação, marcações e relatórios num único lugar.',
    },
    lash: {
      titulo: 'A gestão do teu estúdio de pestanas, simplificada.',
      sub: 'Faturação, marcações e relatórios num único lugar.',
    },
    tatuador: {
      titulo: 'A gestão do teu estúdio de tatuagem, simplificada.',
      sub: 'Faturação, marcações e relatórios num único lugar.',
    },
  }

  const tag = taglines[nicho.id] ?? taglines.barbeiro

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand, desktop only */}
      <div className="hidden lg:flex lg:w-1/2">
        <div
          className="flex flex-col justify-between text-white p-12 min-h-screen w-full"
          style={{ backgroundColor: nicho.cor }}
        >
          {/* Top: Logo */}
          <div className="flex items-center gap-3">
            <span className="font-serif italic font-bold text-2xl text-white">
              Fatura<span style={{ color: nicho.corDestaque }}>+</span>
              <span className="font-sans not-italic font-light text-white/40 mx-2">|</span>
              {nicho.nome.slice(0, -1)}<span style={{ color: nicho.corDestaque }}>+</span>
            </span>
          </div>

          {/* Middle: Tagline */}
          <div>
            <p className="font-serif font-bold text-4xl text-white leading-snug mb-4">
              {tag.titulo}
            </p>
            <p className="text-white/60 text-sm leading-relaxed">{tag.sub}</p>

            <ul className="mt-8 space-y-3">
              {['Faturação em tempo real', 'Relatórios automáticos', 'Conselheiro IA', 'Marcações online'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                  <span
                    className="material-symbols-outlined icon-filled text-[16px]"
                    style={{ color: nicho.corDestaque === '#ffffff' ? 'rgba(255,255,255,0.9)' : nicho.corDestaque }}
                  >
                    check_circle
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom: decoration */}
          <div className="relative h-24">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute bottom-4 right-8 w-16 h-16 rounded-full" style={{ backgroundColor: `${nicho.corDestaque}20` }} />
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2">
        <div className="flex items-center justify-center px-6 py-12 min-h-screen" style={{ backgroundColor: nicho.corFundo }}>
          <div className="w-full max-w-sm">
            {/* Mobile only: logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex justify-center mb-3">
                <NichoLogo size="lg" />
              </div>
              <span className="font-serif italic font-bold text-2xl" style={{ color: nicho.cor }}>
                Fatura<span style={{ color: nicho.corDestaque === '#ffffff' ? nicho.cor : nicho.corDestaque }}>+</span>
                <span className="font-sans not-italic font-light mx-2" style={{ color: `${nicho.cor}60` }}>|</span>
                {nicho.nome.slice(0, -1)}<span style={{ color: nicho.corDestaque === '#ffffff' ? nicho.cor : nicho.corDestaque }}>+</span>
              </span>
            </div>

            <h2 className="font-serif font-bold text-2xl text-[#1c1c18] mb-1">Bem-vindo de volta</h2>
            <p className="text-sm text-[#717971] mb-8">Entra na tua conta para continuar</p>

            {notice && (
              <div className="bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-lg border border-amber-200 mb-4">
                {notice}
              </div>
            )}

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
                  <Link href="/recuperar-password" className="text-xs hover:opacity-80 transition-opacity" style={{ color: nicho.corDestaque === '#ffffff' ? nicho.cor : nicho.corDestaque }}>
                    Esqueceste?
                  </Link>
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
                className="w-full py-3 mt-2 rounded-lg font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: nicho.cor, color: 'white' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    A entrar...
                  </span>
                ) : 'Entrar'}
              </button>
            </form>

            {/* Só mostra "pedir acesso" na landing geral, não nos subdomínios */}
            {!isSubdominio && (
              <p className="text-center text-sm text-[#717971] mt-6">
                Ainda não tens conta?{' '}
                <Link href="/pedir-acesso" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: nicho.corDestaque === '#ffffff' ? nicho.cor : nicho.corDestaque }}>
                  Pedir acesso
                </Link>
              </p>
            )}

            <p className="text-center text-2xs text-[#717971]/60 mt-8">
              © 2026 {nicho.nome} ·{' '}
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
