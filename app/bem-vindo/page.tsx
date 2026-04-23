'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getNichoConfig } from '@/lib/nicho'

export default function BemVindoPage() {
  const router = useRouter()
  const supabase = createClient()
  const nicho = getNichoConfig()

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [skipping, setSkipping] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login')
    })
  }, [supabase, router])

  const handleDefinir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('A password deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirmar) { setError('As passwords não coincidem.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(`Erro: ${error.message}`)
      setSaving(false)
      return
    }
    router.push('/dashboard')
  }

  const handleSaltar = () => {
    setSkipping(true)
    router.push('/dashboard')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: nicho.corFundo }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white mb-3"
            style={{ backgroundColor: nicho.cor }}
          >
            {nicho.letraLogo}+
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: `${nicho.cor}15` }}
          >
            <span
              className="material-symbols-outlined icon-filled"
              style={{ fontSize: '28px', color: nicho.cor }}
            >
              check_circle
            </span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-ink">
            {nicho.nomeNegocio.charAt(0).toUpperCase() + nicho.nomeNegocio.slice(1)} configurado!
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Um último passo — define uma password para entrar sem precisar de link por email.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-surface-secondary">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px', color: nicho.cor }}
            >
              lock
            </span>
            <h2 className="section-title">Definir password</h2>
          </div>

          <form onSubmit={handleDefinir} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                Nova password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                className="input-field"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                Confirmar password
              </label>
              <input
                type="password"
                value={confirmar}
                onChange={e => { setConfirmar(e.target.value); setError('') }}
                className="input-field"
                placeholder="Repete a password"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-700 text-xs bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg font-medium text-sm text-white transition-all disabled:opacity-60"
              style={{ backgroundColor: nicho.cor }}
            >
              {saving ? 'A guardar...' : 'Definir password e entrar'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-surface-secondary text-center">
            <button
              onClick={handleSaltar}
              disabled={skipping}
              className="text-sm text-ink-secondary hover:text-ink transition-colors"
            >
              Saltar por agora — entrar com link por email sempre que precisar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
