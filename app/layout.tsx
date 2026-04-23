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

// Espaços RGB para CSS variables (suporte a opacidade no Tailwind)
const nichoCssVars: Record<string, string> = {
  barbeiro: `
    --verde: 14 67 36;
    --verde-escuro: 10 48 25;
    --verde-claro: 21 92 51;
    --dourado: 151 124 48;
    --dourado-claro: 184 154 69;
    --dourado-escuro: 122 99 37;
    --fundo: 252 249 243;
  `,
  nails: `
    --verde: 139 26 74;
    --verde-escuro: 107 18 56;
    --verde-claro: 168 34 94;
    --dourado: 244 143 177;
    --dourado-claro: 249 168 196;
    --dourado-escuro: 190 100 130;
    --fundo: 255 245 248;
  `,
  lash: `
    --verde: 59 7 100;
    --verde-escuro: 46 5 79;
    --verde-claro: 74 20 140;
    --dourado: 216 180 254;
    --dourado-claro: 233 213 255;
    --dourado-escuro: 167 139 250;
    --fundo: 250 245 255;
  `,
  tatuador: `
    --verde: 17 24 39;
    --verde-escuro: 9 14 26;
    --verde-claro: 31 41 55;
    --dourado: 156 163 175;
    --dourado-claro: 209 213 219;
    --dourado-escuro: 107 114 128;
    --fundo: 249 250 251;
  `,
}

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
  const nicho = process.env.NEXT_PUBLIC_NICHO
  const cssVars = nicho ? nichoCssVars[nicho] : nichoCssVars.barbeiro

  return (
    <html lang="pt" className={`${inter.variable} ${notoSerif.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        {cssVars && (
          <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVars} }` }} />
        )}
      </head>
      <body className="min-h-screen bg-fundo antialiased">
        {children}
        <Analytics />
        <CookieBanner />
      </body>
    </html>
  )
}
