'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { label: 'Visão Geral', href: '/admin', icon: 'dashboard' },
  { label: 'Clientes', href: '/admin/clientes', icon: 'people' },
  { label: 'Consultoria', href: '/admin/consultoria', icon: 'psychology' },
  { label: 'Pagamentos', href: '/admin/pagamentos', icon: 'payments' },
  { label: 'Renovações', href: '/admin/renovacoes', icon: 'autorenew' },
  { label: 'Pedidos', href: '/admin/pedidos', icon: 'person_add' },
]

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col min-h-screen"
      style={{ backgroundColor: '#071f10' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 relative flex-shrink-0">
          <Image
            src="/images/Logo_F_.png"
            alt="Fatura+ Logo"
            width={36}
            height={36}
            className="object-contain"
          />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-serif italic text-white font-bold text-lg leading-none truncate">
            Fatura+
          </span>
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0">
            Admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <p className="text-[10px] uppercase tracking-widest text-white/30 px-4 pb-1 pt-4">
          Menu
        </p>
        <div className="space-y-0.5">
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'border-l-2 border-[#977c30] bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[18px] leading-none"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        {/* User email */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <span
              className="material-symbols-outlined text-[14px] text-white/70 leading-none"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
            >
              person
            </span>
          </div>
          <span className="text-white/50 text-xs truncate">{userEmail}</span>
        </div>

        {/* Back to App */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-white/60 hover:text-white text-xs py-1.5 transition-colors"
        >
          <span
            className="material-symbols-outlined text-[14px] leading-none"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
          >
            arrow_back
          </span>
          Voltar ao App
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-400/80 hover:text-red-400 text-xs py-1.5 transition-colors w-full text-left"
        >
          <span
            className="material-symbols-outlined text-[14px] leading-none"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
          >
            logout
          </span>
          Terminar sessão
        </button>
      </div>
    </aside>
  )
}
