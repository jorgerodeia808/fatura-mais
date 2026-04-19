'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PerfilPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaPassword, setNovaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email)
        setNovoEmail(user.email)
      }
      setLoading(false)
    })
  }, [supabase])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3500)
  }

  const handleAlterarEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novoEmail === email) { showToast('O email é o mesmo.', 'error'); return }
    setSavingEmail(true)
    const { error } = await supabase.auth.updateUser({ email: novoEmail })
    setSavingEmail(false)
    if (error) {
      showToast(`Erro: ${error.message}`, 'error')
    } else {
      showToast('Verifica o novo email para confirmar a alteração ✓')
    }
  }

  const handleAlterarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novaPassword.length < 6) { showToast('A password deve ter pelo menos 6 caracteres.', 'error'); return }
    if (novaPassword !== confirmarPassword) { showToast('As passwords não coincidem.', 'error'); return }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: novaPassword })
    setSavingPassword(false)
    if (error) {
      showToast(`Erro: ${error.message}`, 'error')
    } else {
      showToast('Password alterada com sucesso ✓')
      setNovaPassword('')
      setConfirmarPassword('')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="animate-pulse h-48 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0e4324]">Perfil</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gere os dados da tua conta</p>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 text-white ${toastType === 'error' ? 'bg-red-600' : 'bg-[#0e4324]'}`}>
          {toast}
        </div>
      )}

      {/* Email */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-[#0e4324]">Endereço de email</h2>
          <p className="text-xs text-gray-400 mt-0.5">Email atual: <strong>{email}</strong></p>
        </div>
        <form onSubmit={handleAlterarEmail} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Novo email</label>
            <input
              type="email"
              value={novoEmail}
              onChange={e => setNovoEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            />
          </div>
          <p className="text-xs text-gray-400">Será enviado um email de confirmação para o novo endereço.</p>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingEmail || novoEmail === email}
              className="text-sm bg-[#0e4324] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#0a3019] disabled:opacity-50 transition-colors"
            >
              {savingEmail ? 'A guardar...' : 'Alterar email'}
            </button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-[#0e4324]">Password</h2>
          <p className="text-xs text-gray-400 mt-0.5">Define uma nova password para a tua conta</p>
        </div>
        <form onSubmit={handleAlterarPassword} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nova password</label>
            <input
              type="password"
              value={novaPassword}
              onChange={e => setNovaPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar password</label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={e => setConfirmarPassword(e.target.value)}
              required
              placeholder="Repete a password"
              autoComplete="new-password"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword || !novaPassword || !confirmarPassword}
              className="text-sm bg-[#0e4324] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#0a3019] disabled:opacity-50 transition-colors"
            >
              {savingPassword ? 'A guardar...' : 'Alterar password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
