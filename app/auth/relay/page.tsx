'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function AuthRelayPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handle = async () => {
      const query = new URLSearchParams(window.location.search)
      const hash = window.location.hash
      const tipo = query.get('tipo') ?? 'login'

      if (!hash) {
        router.replace('/login?erro=link_invalido')
        return
      }

      const params = new URLSearchParams(hash.slice(1))
      const accessToken = params.get('at')
      const refreshToken = params.get('rt')

      if (!accessToken || !refreshToken) {
        router.replace('/login?erro=link_invalido')
        return
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        router.replace('/login?erro=link_invalido')
        return
      }

      router.replace(tipo === 'convite' ? '/recuperar-password/nova?tipo=convite' : '/dashboard')
    }

    handle()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fcf9f3]">
      <Image src="/images/Logo_F_.png" alt="Fatura+" width={48} height={48} />
      <p className="text-sm text-gray-500">A redirecionar...</p>
    </div>
  )
}
