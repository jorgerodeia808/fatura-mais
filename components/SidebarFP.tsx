'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SidebarFPProps {
  userName: string
}

const FP_BG = '#1e3a5f'
const FP_ACCENT = '#c9a84c'

const navItems = [
  { label: 'Dashboard',     href: '/dashboard',    icon: 'dashboard'         },
  { label: 'Transações',    href: '/transacoes',   icon: 'swap_vert'         },
  { label: 'Recorrentes',   href: '/recorrentes',  icon: 'autorenew'         },
  { label: 'Orçamentos',    href: '/orcamentos',   icon: 'pie_chart'         },
  { label: 'Objetivos',     href: '/objetivos',    icon: 'flag'              },
  { label: 'Configurações', href: '/configuracoes',icon: 'settings'          },
  { label: 'Perfil',        href: '/perfil',       icon: 'manage_accounts'   },
]

export default function SidebarFP({ userName }: SidebarFPProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: FP_BG }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
          style={{ background: FP_ACCENT, color: FP_BG }}>
          FP
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-white font-semibold text-sm tracking-tight">Finanças Pessoais</span>
          <span style={{ color: FP_ACCENT }} className="font-bold text-sm">+</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? `${FP_ACCENT}22` : 'transparent',
                color: active ? FP_ACCENT : 'rgba(255,255,255,0.65)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: FP_ACCENT, color: FP_BG }}>
            {initials}
          </div>
          <p className="text-xs text-white/60 truncate flex-1">{userName}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
          Terminar sessão
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 border-b border-white/10"
        style={{ background: FP_BG }}>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-white/70">
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>menu</span>
        </button>
        <div className="flex items-center gap-1.5 mx-auto">
          <span className="text-white font-semibold text-sm">Finanças Pessoais</span>
          <span style={{ color: FP_ACCENT }} className="font-bold text-sm">+</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 lg:z-30">
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 flex flex-col">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
