import Link from 'next/link'
import { redirect } from 'next/navigation'
import AuthErrorRedirect from './components/AuthErrorRedirect'
import Image from 'next/image'

// ── Landing geral do Fatura+ ───────────────────────────────────────────────────
export default function LandingPage() {
  // Nos subdomínios de nicho não há landing page — vai direto para login
  if (process.env.NEXT_PUBLIC_NICHO) redirect('/login')

  const nichos = [
    {
      id: 'barbeiro',
      nome: 'Barber',
      letra: 'B',
      cor: '#2d2d2d',
      corDestaque: '#977c30',
      descricao: 'Gestão financeira para barbearias. Faturação, marcações e relatórios num só lugar.',
      url: 'https://barbeiro.fatura-mais.pt',
      ativo: true,
    },
    {
      id: 'nails',
      nome: 'Nails',
      letra: 'N',
      cor: '#e8779a',
      corDestaque: '#ffffff',
      descricao: 'Gestão do teu estúdio de unhas. Clientes, serviços e faturação sem complicações.',
      url: 'https://nails.fatura-mais.pt',
      ativo: true,
    },
    {
      id: 'lash',
      nome: 'Lash',
      letra: 'L',
      cor: '#4a148c',
      corDestaque: '#c9a96e',
      descricao: 'Plataforma de gestão para estúdios de pestanas. Em breve.',
      url: null,
      ativo: false,
    },
    {
      id: 'tatuador',
      nome: 'Tattoo',
      letra: 'T',
      cor: '#111111',
      corDestaque: '#c62828',
      descricao: 'Gestão para estúdios de tatuagem e piercing. Em breve.',
      url: null,
      ativo: false,
    },
  ]

  return (
    <div className="min-h-screen bg-fundo font-sans">
      <AuthErrorRedirect />

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="bg-[#fcf9f3]/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/images/Logo_F_.png" alt="Fatura+" width={36} height={36} />
            <span className="font-serif italic font-bold text-verde text-xl leading-none">
              Fatura<span className="text-dourado">+</span>
            </span>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-1.5 bg-[#977c30]/10 text-[#7a6325] text-xs font-medium px-3 py-1 rounded-full mb-6">
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: '14px' }}>verified</span>
          Plataforma de gestão para profissionais
        </span>
        <h1 className="font-serif font-bold text-5xl lg:text-6xl text-verde leading-tight mb-5">
          A gestão do teu negócio,<br />simplificada.
        </h1>
        <p className="text-ink-secondary text-lg leading-relaxed max-w-xl mx-auto mb-10">
          Escolhe a plataforma do teu nicho. Faturação, marcações, relatórios e IA num único lugar.
        </p>
        <Link
          href="/pedir-acesso"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-base text-white transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5"
          style={{ backgroundColor: '#0e4324' }}
        >
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: '20px' }}>arrow_forward</span>
          Pedir acesso
        </Link>
      </section>

      {/* ── NICHO CARDS ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {nichos.map((n) => {
            const card = (
              <div
                key={n.id}
                className={`relative rounded-2xl p-8 border transition-all duration-300 ${
                  n.ativo
                    ? 'border-black/8 bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                    : 'border-black/5 bg-white/60 opacity-60 cursor-not-allowed'
                }`}
              >
                {!n.ativo && (
                  <span className="absolute top-4 right-4 text-2xs font-medium bg-black/8 text-ink-secondary px-2.5 py-1 rounded-full">
                    Em breve
                  </span>
                )}

                {/* Logo */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: n.cor }}
                >
                  <span
                    className="font-serif font-bold italic text-2xl"
                    style={{ color: 'white' }}
                  >
                    {n.letra}
                    <span style={{ color: n.corDestaque === '#ffffff' ? 'rgba(255,255,255,0.7)' : n.corDestaque }}>+</span>
                  </span>
                </div>

                <h3 className="font-serif font-bold text-2xl text-verde mb-2">
                  {n.nome}<span className="text-dourado">+</span>
                </h3>
                <p className="text-ink-secondary text-sm leading-relaxed mb-6">{n.descricao}</p>

                {n.ativo && (
                  <span
                    className="inline-flex items-center gap-1.5 text-sm font-medium"
                    style={{ color: n.cor }}
                  >
                    Aceder à plataforma
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                  </span>
                )}
              </div>
            )

            return n.ativo && n.url ? (
              <a key={n.id} href={n.url}>{card}</a>
            ) : (
              <div key={n.id}>{card}</div>
            )
          })}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-black/5 py-10 bg-surface-secondary">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/images/Logo_F_.png" alt="Fatura+" width={28} height={28} />
            <span className="font-serif italic font-bold text-verde text-base leading-none">
              Fatura<span className="text-dourado">+</span>
            </span>
          </div>
          <p className="text-xs text-ink-tertiary">© 2026 Fatura+ · faturamais30@gmail.com</p>
          <div className="flex items-center gap-5">
            <Link href="/privacidade" className="text-xs text-ink-secondary hover:text-verde transition-colors">Privacidade</Link>
            <Link href="/termos" className="text-xs text-ink-secondary hover:text-verde transition-colors">Termos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
