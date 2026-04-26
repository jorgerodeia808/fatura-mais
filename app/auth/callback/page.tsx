'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handle = async () => {
      const query = new URLSearchParams(window.location.search)
      const hash = window.location.hash
      const next = query.get('next') ?? '/onboarding'

      // PKCE flow: code em query param
      const code = query.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) { router.replace(next); return }
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
