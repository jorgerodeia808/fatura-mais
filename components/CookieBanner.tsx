'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ConsentValue = 'essential' | 'all'

const CONSENT_KEY = 'cookie-consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const existing = localStorage.getItem(CONSENT_KEY)
    if (!existing) {
      setVisible(true)
    }
  }, [])

  const handleConsent = (value: ConsentValue) => {
    localStorage.setItem(CONSENT_KEY, value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          Usamos cookies para melhorar a tua experiência. Consulta a nossa{' '}
          <Link
            href="/cookies"
            className="text-[#0e4324] underline hover:text-[#0a3019] transition-colors"
          >
            Política de Cookies
          </Link>
          .
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleConsent('essential')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 whitespace-nowrap"
          >
            Só essenciais
          </button>
          <button
            onClick={() => handleConsent('all')}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#0e4324] rounded-lg hover:bg-[#0a3019] transition-colors duration-200 whitespace-nowrap"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  )
}
