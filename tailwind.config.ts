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
        fundo: '#f7f5f0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
