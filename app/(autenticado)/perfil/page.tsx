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
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

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

  const handleEliminarConta = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return
    setDeletingAccount(true)
    const res = await fetch('/api/conta/eliminar', { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      showToast(data.error ?? 'Erro ao eliminar conta.', 'error')
      setDeletingAccount(false)
      return
    }
    await supabase.auth.signOut()
    window.location.href = '/'
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
        <h1 className="text-2xl font-bold text-verde">Perfil</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gere os dados da tua conta</p>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 text-white ${toastType === 'error' ? 'bg-red-600' : 'bg-verde'}`}>
          {toast}
        </div>
      )}

      {/* Email */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-verde">Endereço de email</h2>
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-verde transition-colors"
            />
          </div>
          <p className="text-xs text-gray-400">Será enviado um email de confirmação para o novo endereço.</p>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingEmail || novoEmail === email}
              className="text-sm bg-verde text-white px-4 py-2 rounded-xl font-medium hover:bg-verde-escuro disabled:opacity-50 transition-colors"
            >
              {savingEmail ? 'A guardar...' : 'Alterar email'}
            </button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-verde">Password</h2>
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-verde transition-colors"
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-verde transition-colors"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword || !novaPassword || !confirmarPassword}
              className="text-sm bg-verde text-white px-4 py-2 rounded-xl font-medium hover:bg-verde-escuro disabled:opacity-50 transition-colors"
            >
              {savingPassword ? 'A guardar...' : 'Alterar password'}
            </button>
          </div>
        </form>
      </div>
      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-50 bg-red-50/50">
          <h2 className="text-sm font-semibold text-red-700">Zona de perigo</h2>
          <p className="text-xs text-red-400 mt-0.5">Ações irreversíveis sobre a tua conta</p>
        </div>
        <div className="p-6">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Eliminar conta</p>
                <p className="text-xs text-gray-400 mt-0.5">Elimina permanentemente a conta e todos os dados associados.</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-xl font-medium hover:bg-red-50 transition-colors"
              >
                Eliminar conta
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-700 font-medium">
                Esta ação é irreversível. Todos os teus dados (faturação, despesas, marcações) serão eliminados.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Escreve <strong>ELIMINAR</strong> para confirmar
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="ELIMINAR"
                  className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleEliminarConta}
                  disabled={deleteConfirmText !== 'ELIMINAR' || deletingAccount}
                  className="text-sm bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {deletingAccount ? 'A eliminar...' : 'Confirmar eliminação'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                  className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

