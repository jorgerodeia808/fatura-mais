import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        verde: {
          DEFAULT: '#0e4324',
          escuro: '#0a3019',
          claro: '#155c33',
        },
        dourado: {
          DEFAULT: '#977c30',
          claro: '#b89a45',
          escuro: '#7a6325',
        },
        fundo: '#fcf9f3',
        surface: {
          DEFAULT: '#fcf9f3',
          card: '#ffffff',
          secondary: '#f0eee8',
          high: '#ebe8e2',
          highest: '#e5e2dc',
        },
        ink: {
          DEFAULT: '#1c1c18',
          secondary: '#717971',
          tertiary: '#a8a89f',
        },
        border: 'rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-noto-serif)', 'Noto Serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.10)',
        sm: '0 1px 2px rgba(0,0,0,0.05)',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.04em' }],
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '22px' }],
        md: ['15px', { lineHeight: '24px' }],
        lg: ['17px', { lineHeight: '26px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['28px', { lineHeight: '36px' }],
        '4xl': ['32px', { lineHeight: '40px' }],
        '5xl': ['40px', { lineHeight: '48px' }],
        '6xl': ['48px', { lineHeight: '56px' }],
      },
    },
  },
  plugins: [],
}
export default config
