'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const nichoUrl: Record<string, string> = {
  barbeiro: 'https://barbeiro.fatura-mais.pt',
  nails:    'https://nails.fatura-mais.pt',
  lash:     'https://lash.fatura-mais.pt',
  tatuador: 'https://tatuador.fatura-mais.pt',
  fp:       'https://fp.fatura-mais.pt',
}

function getCurrentNicho(): string {
  if (typeof window === 'undefined') return 'barbeiro'
  const host = window.location.hostname
  for (const [key, url] of Object.entries(nichoUrl)) {
    if (url.includes(host)) return key
  }
  return 'barbeiro'
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handle = async () => {
      const query = new URLSearchParams(window.location.search)
      const hash = window.location.hash
      const next = query.get('next') ?? '/onboarding'
      const typeParam = query.get('type')
      const nichoParam = query.get('nicho')
      const currentNicho = getCurrentNicho()

      // Determina se precisa de relay para outro nicho
      const targetNicho = nichoParam || currentNicho
      const needsRelay = targetNicho !== currentNicho && nichoUrl[targetNicho]

      // PKCE flow: code em query param
      const code = query.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          if (needsRelay) {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              const tipo = typeParam === 'invite' ? 'convite' : 'login'
              window.location.href = `${nichoUrl[targetNicho]}/auth/relay?tipo=${tipo}#at=${session.access_token}&rt=${session.refresh_token}`
              return
            }
          }
          if (typeParam === 'invite') {
            router.replace('/recuperar-password/nova?tipo=convite')
          } else {
            router.replace(next)
          }
          return
        }
      }

      // Implicit flow: tokens no hash
      if (hash) {
        const params = new URLSearchParams(hash.slice(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const error = params.get('error')
        const errorCode = params.get('error_code')

        if (error) {
          if (errorCode === 'otp_expired') {
            router.replace('/login?erro=link_expirado')
          } else {
            router.replace('/login?erro=link_invalido')
          }
          return
        }

        if (accessToken && refreshToken) {
          const type = params.get('type')

          if (needsRelay) {
            const tipo = type === 'invite' ? 'convite' : 'login'
            window.location.href = `${nichoUrl[targetNicho]}/auth/relay?tipo=${tipo}#at=${accessToken}&rt=${refreshToken}`
            return
          }

          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!sessionError) {
            if (type === 'invite') {
              router.replace('/recuperar-password/nova?tipo=convite')
            } else {
              router.replace(next)
            }
            return
          }
        }
      }

      router.replace('/login?erro=link_invalido')
    }

    handle()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fcf9f3]">
      <Image src="/images/Logo_F_.png" alt="Fatura+" width={48} height={48} />
      <p className="text-sm text-gray-500">A validar o teu acesso...</p>
    </div>
  )
}
