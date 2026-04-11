import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fatura+ | Gestão financeira para barbearias',
  description: 'Controla a faturação, despesas e marcações da tua barbearia. Com conselheiro financeiro IA incluído.',
  keywords: 'barbearia, gestão financeira, faturação, despesas, marcações, SaaS',
  authors: [{ name: 'Fatura+' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Fatura+',
  },
  openGraph: {
    title: 'Fatura+ | Gestão financeira para barbearias',
    description: 'Controla a faturação, despesas e marcações da tua barbearia. Com conselheiro financeiro IA incluído.',
    url: 'https://fatura-mais.pt',
    siteName: 'Fatura+',
    locale: 'pt_PT',
    type: 'website',
    images: [
      {
        url: 'https://fatura-mais.pt/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Fatura+',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Fatura+ | Gestão financeira para barbearias',
    description: 'Controla a faturação, despesas e marcações da tua barbearia.',
    images: ['https://fatura-mais.pt/icons/icon-512.png'],
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0e4324',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Fatura+" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
      </head>
      <body className="min-h-screen bg-fundo antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
