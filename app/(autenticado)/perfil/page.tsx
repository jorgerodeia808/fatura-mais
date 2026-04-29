'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FP_PRIMARY = '#1e3a5f'
const FP_ACCENT = '#c9a84c'

// ── FP+ Perfil ─────────────────────────────────────────────────────
function PerfilFP() {
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
  const [perfil, setPerfil] = useState<{ plano: string; subscricao_renovacao: string | null } | null>(null)
  const [nomeCompleto, setNomeCompleto] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) { setEmail(user.email); setNovoEmail(user.email) }
      if (user?.user_metadata?.nome_completo) setNomeCompleto(user.user_metadata.nome_completo)
      if (user) {
        const { data } = await supabase.from('fp_perfis').select('plano, subscricao_renovacao').eq('user_id', user.id).maybeSingle()
        if (data) setPerfil(data)
      }
      setLoading(false)
    }
    init()
  }, [supabase])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 3500)
  }

  const handleAlterarEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novoEmail === email) { showToast('O email é o mesmo.', 'error'); return }
    setSavingEmail(true)
    const { error } = await supabase.auth.updateUser({ email: novoEmail })
    setSavingEmail(false)
    if (error) showToast(`Erro: ${error.message}`, 'error')
    else showToast('Verifica o novo email para confirmar a alteração ✓')
  }

  const handleAlterarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novaPassword.length < 6) { showToast('Mínimo 6 caracteres.', 'error'); return }
    if (novaPassword !== confirmarPassword) { showToast('As passwords não coincidem.', 'error'); return }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: novaPassword })
    setSavingPassword(false)
    if (error) showToast(`Erro: ${error.message}`, 'error')
    else { showToast('Password alterada com sucesso ✓'); setNovaPassword(''); setConfirmarPassword('') }
  }

  const plano = perfil?.plano
  const renovacao = perfil?.subscricao_renovacao
  const diasRenovacao = renovacao ? Math.ceil((new Date(renovacao).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
  const renovacaoFmt = renovacao ? new Date(renovacao).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : null

  const planoLabel = plano === 'vitalicio' ? '★ Vitalício' : plano === 'mensal' ? 'Mensal' : plano === 'trial' ? 'Trial' : 'Suspenso'
  const planoColor = plano === 'vitalicio' ? FP_ACCENT : plano === 'trial' ? '#8b5cf6' : plano === 'mensal' ? '#16a34a' : '#dc2626'
  const initials = nomeCompleto.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || email.charAt(0).toUpperCase()

  const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2.5">
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: FP_PRIMARY }}>{icon}</span>
        <h2 className="text-sm font-semibold" style={{ color: FP_PRIMARY }}>{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
            <div className="h-10 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: FP_PRIMARY }}>Perfil</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gere os dados da tua conta</p>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 text-white ${toastType === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast}
        </div>
      )}

      {/* Avatar + nome */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{ background: FP_ACCENT, color: FP_PRIMARY }}>
          {initials}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{nomeCompleto || email}</p>
          <p className="text-sm text-slate-500">{email}</p>
        </div>
        {plano && (
          <span className="ml-auto px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${planoColor}18`, color: planoColor }}>
            {planoLabel}
          </span>
        )}
      </div>

      {/* Subscription */}
      {perfil && (
        <Section title="Subscrição FP+" icon="workspace_premium">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: `${planoColor}18`, color: planoColor }}>
                {planoLabel}
              </span>
              {plano === 'mensal' && renovacaoFmt && (
                <p className="text-sm text-slate-600">
                  Renova em <strong>{renovacaoFmt}</strong>
                  {diasRenovacao !== null && ` (${diasRenovacao} dias)`}
                </p>
              )}
              {plano === 'vitalicio' && <p className="text-sm text-slate-500">Acesso permanente.</p>}
              {plano === 'trial' && <p className="text-sm text-slate-500">Período de trial gratuito ativo.</p>}
            </div>
            {(plano === 'trial' || (plano === 'mensal' && diasRenovacao !== null && diasRenovacao <= 10)) && (
              <a
                href="mailto:faturamais30@gmail.com?subject=Upgrade%20FP%2B"
                className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{ background: `${FP_ACCENT}20`, color: FP_ACCENT }}
              >
                Fazer upgrade →
              </a>
            )}
          </div>
        </Section>
      )}

      {/* Email */}
      <Section title="Endereço de email" icon="mail">
        <form onSubmit={handleAlterarEmail} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Novo email</label>
            <input type="email" value={novoEmail} onChange={e => setNovoEmail(e.target.value)} required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
          </div>
          <p className="text-xs text-slate-400">Será enviado um email de confirmação para o novo endereço.</p>
          <div className="flex justify-end">
            <button type="submit" disabled={savingEmail || novoEmail === email}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: FP_PRIMARY }}>
              {savingEmail ? 'A guardar...' : 'Alterar email'}
            </button>
          </div>
        </form>
      </Section>

      {/* Password */}
      <Section title="Password" icon="lock">
        <form onSubmit={handleAlterarPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nova password</label>
            <input type="password" value={novaPassword} onChange={e => setNovaPassword(e.target.value)} required minLength={6}
              placeholder="Mínimo 6 caracteres" autoComplete="new-password"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirmar password</label>
            <input type="password" value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} required
              placeholder="Repete a password" autoComplete="new-password"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingPassword || !novaPassword || !confirmarPassword}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: FP_PRIMARY }}>
              {savingPassword ? 'A guardar...' : 'Alterar password'}
            </button>
          </div>
        </form>
      </Section>
    </div>
  )
}

// ── Nicho Perfil ────────────────────────────────────────────────────
function PerfilNicho() {
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
  const [subscricao, setSubscricao] = useState<{ plano: string | null; subscricao_renovacao: string | null } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
        setNovoEmail(user.email)
      }
      setLoading(false)
      if (user) {
        const { data } = await supabase
          .from('barbearias')
          .select('plano, subscricao_renovacao')
          .eq('user_id', user.id)
          .single()
        setSubscricao(data)
      }
    }
    init()
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

  // Subscription display values
  const plano = subscricao?.plano
  const renovacao = subscricao?.subscricao_renovacao
  const diasRenovacao = renovacao
    ? Math.ceil((new Date(renovacao).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const renovacaoFmt = renovacao
    ? new Date(renovacao).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : null
  const subscricaoUrgente = diasRenovacao !== null && diasRenovacao <= 5 && diasRenovacao > 0

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="animate-pulse h-7 w-32 bg-surface-high rounded-lg" />
        <div className="card overflow-hidden !p-0">
          <div className="h-14 bg-surface-secondary animate-pulse" />
          <div className="p-6 space-y-3">
            <div className="h-3 w-20 bg-surface-high rounded animate-pulse" />
            <div className="h-10 bg-surface-secondary rounded-lg animate-pulse" />
            <div className="h-9 w-28 bg-surface-high rounded-lg animate-pulse ml-auto" />
          </div>
        </div>
        <div className="card overflow-hidden !p-0">
          <div className="h-14 bg-surface-secondary animate-pulse" />
          <div className="p-6 space-y-3">
            <div className="h-10 bg-surface-secondary rounded-lg animate-pulse" />
            <div className="h-10 bg-surface-secondary rounded-lg animate-pulse" />
            <div className="h-9 w-28 bg-surface-high rounded-lg animate-pulse ml-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif font-bold text-2xl text-ink">Perfil</h1>
        <p className="text-sm text-ink-secondary mt-0.5">Gere os dados da tua conta</p>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 text-white ${toastType === 'error' ? 'bg-red-600' : 'bg-verde'}`}>
          {toast}
        </div>
      )}

      {/* Subscrição */}
      {subscricao && (
        <div className="card overflow-hidden !p-0">
          <div className="px-6 py-4 border-b border-black/5 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-verde" style={{ fontSize: '18px' }}>workspace_premium</span>
            <div>
              <h2 className="text-sm font-medium text-ink">Subscrição</h2>
              <p className="text-xs text-ink-secondary">Plano atual e informações de renovação</p>
            </div>
          </div>
          <div className="p-6 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                plano === 'vitalicio' ? 'badge-gold' :
                plano === 'mensal'    ? 'bg-verde/10 text-verde' :
                                       'badge-red'
              }`}>
                {plano === 'vitalicio' ? '★ Vitalício' : plano === 'mensal' ? 'Mensal' : 'Suspenso'}
              </span>
              {plano === 'mensal' && renovacaoFmt && (
                <p className={`text-sm ${subscricaoUrgente ? 'text-amber-700 font-medium' : 'text-ink-secondary'}`}>
                  {subscricaoUrgente
                    ? `⚠️ Renova ${diasRenovacao === 1 ? 'amanhã' : `em ${diasRenovacao} dias`} — ${renovacaoFmt}`
                    : `Renova em ${renovacaoFmt}${diasRenovacao !== null ? ` (${diasRenovacao} dias)` : ''}`}
                </p>
              )}
              {plano === 'vitalicio' && (
                <p className="text-sm text-ink-secondary">Acesso permanente sem renovações.</p>
              )}
            </div>
            {plano === 'mensal' && subscricaoUrgente && (
              <a
                href="mailto:faturamais30@gmail.com?subject=Renovação%20de%20subscrição"
                className="flex-shrink-0 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Renovar →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Email */}
      <div className="card overflow-hidden !p-0">
        <div className="px-6 py-4 border-b border-black/5 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-verde" style={{ fontSize: '18px' }}>mail</span>
          <div>
            <h2 className="text-sm font-medium text-ink">Endereço de email</h2>
            <p className="text-xs text-ink-secondary">Email atual: <strong>{email}</strong></p>
          </div>
        </div>
        <form onSubmit={handleAlterarEmail} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Novo email</label>
            <input
              type="email"
              value={novoEmail}
              onChange={e => setNovoEmail(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <p className="text-xs text-ink-tertiary">Será enviado um email de confirmação para o novo endereço.</p>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingEmail || novoEmail === email}
              className="btn-primary disabled:opacity-50"
            >
              {savingEmail ? 'A guardar...' : 'Alterar email'}
            </button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="card overflow-hidden !p-0">
        <div className="px-6 py-4 border-b border-black/5 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-verde" style={{ fontSize: '18px' }}>lock</span>
          <div>
            <h2 className="text-sm font-medium text-ink">Password</h2>
            <p className="text-xs text-ink-secondary">Define uma nova password para a tua conta</p>
          </div>
        </div>
        <form onSubmit={handleAlterarPassword} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Nova password</label>
            <input
              type="password"
              value={novaPassword}
              onChange={e => setNovaPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">Confirmar password</label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={e => setConfirmarPassword(e.target.value)}
              required
              placeholder="Repete a password"
              autoComplete="new-password"
              className="input-field"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword || !novaPassword || !confirmarPassword}
              className="btn-primary disabled:opacity-50"
            >
              {savingPassword ? 'A guardar...' : 'Alterar password'}
            </button>
          </div>
        </form>
      </div>

      {/* Zona de perigo */}
      <div className="rounded-xl overflow-hidden border border-red-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-red-500" style={{ fontSize: '18px' }}>warning</span>
          <div>
            <h2 className="text-sm font-medium text-red-700">Zona de perigo</h2>
            <p className="text-xs text-red-400">Ações irreversíveis sobre a tua conta</p>
          </div>
        </div>
        <div className="p-6 bg-white">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">Eliminar conta</p>
                <p className="text-xs text-ink-secondary mt-0.5">Elimina permanentemente a conta e todos os dados associados.</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-destructive flex-shrink-0"
              >
                Eliminar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-700 font-medium">
                Esta ação é irreversível. Todos os teus dados (faturação, despesas, marcações) serão eliminados.
              </p>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 uppercase tracking-wide">
                  Escreve <strong>ELIMINAR</strong> para confirmar
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="ELIMINAR"
                  className="input-field border-red-200 focus:border-red-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleEliminarConta}
                  disabled={deleteConfirmText !== 'ELIMINAR' || deletingAccount}
                  className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {deletingAccount ? 'A eliminar...' : 'Confirmar eliminação'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                  className="btn-secondary"
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

export default function PerfilPage() {
  if (process.env.NEXT_PUBLIC_APP_TYPE === 'fp') return <PerfilFP />
  return <PerfilNicho />
}
