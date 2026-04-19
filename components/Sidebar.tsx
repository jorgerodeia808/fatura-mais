'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface SidebarProps {
  userName: string
  barbeariaName: string
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'dashboard',
    section: null,
  },
  {
    label: 'Faturação',
    href: '/faturacao',
    icon: 'payments',
    section: null,
  },
  {
    label: 'Despesas',
    href: '/despesas',
    icon: 'receipt_long',
    section: null,
  },
  {
    label: 'Marcações',
    href: '/marcacoes',
    icon: 'calendar_month',
    section: null,
  },
  {
    label: 'Relatórios',
    href: '/relatorios',
    icon: 'bar_chart',
    section: 'Análise',
  },
  {
    label: 'Conselheiro IA',
    href: '/conselheiro-ia',
    icon: 'psychology',
    section: null,
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: 'settings',
    section: 'Sistema',
  },
  {
    label: 'Perfil',
    href: '/perfil',
    icon: 'manage_accounts',
    section: null,
  },
]

export default function Sidebar({ userName, barbeariaName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
        <Image
          src="/images/Logo_F_.png"
          alt="Fatura+"
          width={36}
          height={36}
          className="rounded-lg flex-shrink-0"
        />
        <span className="font-serif italic font-bold text-white text-lg leading-none">
          Fatura<span className="text-[#977c30]">+</span>
        </span>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto lg:hidden text-white/60 hover:text-white transition-colors p-0.5"
          aria-label="Fechar menu"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            close
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <div key={item.href}>
              {/* Section label */}
              {item.section && (
                <p className="px-4 pt-4 pb-1 text-[10px] font-medium uppercase tracking-widest text-white/30">
                  {item.section}
                </p>
              )}

              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 py-2 pr-3 rounded-r-md mx-0 transition-all duration-150 text-sm font-medium font-sans ${
                  isActive
                    ? 'border-l-2 border-[#977c30] bg-white/10 text-white pl-[14px]'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08] pl-4'
                }`}
              >
                <span
                  className="material-symbols-outlined flex-shrink-0"
                  style={{ fontSize: '20px' }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Bottom user section */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: '#977c30' }}
          >
            {initials || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-white/50 truncate">{barbeariaName}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors p-1.5 rounded-md w-full"
          aria-label="Terminar sessão"
        >
          <span
            className="material-symbols-outlined flex-shrink-0"
            style={{ fontSize: '18px' }}
          >
            logout
          </span>
          <span className="text-xs">Terminar sessão</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger — fixed top-left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-9 h-9 bg-[#0e4324] text-white rounded-lg flex items-center justify-center shadow-md"
        aria-label="Abrir menu"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
          menu
        </span>
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 bg-[#0e4324] min-h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar — slide-in */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[220px] bg-[#0e4324] flex flex-col transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
