import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import CookieBanner from '@/components/CookieBanner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  variable: '--font-noto-serif',
  weight: ['400', '600', '700'],
  display: 'swap',
})

const nichoMeta: Record<string, { nome: string; descricao: string; cor: string; url: string }> = {
  barbeiro: {
    nome: 'Barber+',
    descricao: 'Gestão financeira para barbearias. Faturação, marcações e relatórios num só lugar.',
    cor: '#2d2d2d',
    url: 'https://barbeiro.fatura-mais.pt',
  },
  nails: {
    nome: 'Nails+',
    descricao: 'Gestão do teu estúdio de unhas. Clientes, serviços e faturação sem complicações.',
    cor: '#e8779a',
    url: 'https://nails.fatura-mais.pt',
  },
  lash: {
    nome: 'Lash+',
    descricao: 'Gestão para estúdios de pestanas.',
    cor: '#4a148c',
    url: 'https://lash.fatura-mais.pt',
  },
  tatuador: {
    nome: 'Tattoo+',
    descricao: 'Gestão para estúdios de tatuagem e piercing.',
    cor: '#111111',
    url: 'https://tatuador.fatura-mais.pt',
  },
}

export function generateMetadata(): Metadata {
  const nicho = process.env.NEXT_PUBLIC_NICHO
  const meta = nicho ? nichoMeta[nicho] : null

  const title = meta ? meta.nome : 'Fatura+'
  const description = meta?.descricao ?? 'A plataforma de gestão para profissionais de beleza e estilo.'
  const url = meta?.url ?? 'https://fatura-mais.pt'

  return {
    title,
    description,
    keywords: 'gestão financeira, faturação, marcações, SaaS',
    authors: [{ name: 'Fatura+' }],
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: meta?.nome ?? 'Fatura+',
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Fatura+',
      locale: 'pt_PT',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export function generateViewport(): Viewport {
  const nicho = process.env.NEXT_PUBLIC_NICHO
  const themeColor = nicho ? (nichoMeta[nicho]?.cor ?? '#0e4324') : '#0e4324'
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt" className={`${inter.variable} ${notoSerif.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-screen bg-surface antialiased">
        {children}
        <Analytics />
        <CookieBanner />
      </body>
    </html>
  )
}
