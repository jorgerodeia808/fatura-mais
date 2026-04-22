'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthErrorRedirect() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.slice(1))
    const error = params.get('error')
    const errorCode = params.get('error_code')

    if (error === 'access_denied' && errorCode === 'otp_expired') {
      router.replace('/login?erro=link_expirado')
    } else if (error) {
      router.replace('/login?erro=link_invalido')
    }
  }, [router])

  return null
}
