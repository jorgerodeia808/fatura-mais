import Link from 'next/link'
import { redirect } from 'next/navigation'
import AuthErrorRedirect from './components/AuthErrorRedirect'
import Image from 'next/image'

export default function LandingPage() {
  if (process.env.NEXT_PUBLIC_NICHO) redirect('/login')
  if (process.env.NEXT_PUBLIC_APP_TYPE === 'fp') redirect('/login')

  const nichos = [
    {
      id: 'barbeiro',
      nome: 'Barber',
      letra: 'B',
      cor: '#2d2d2d',
      corDestaque: '#977c30',
      descricao: 'Faturação, marcações e relatórios para barbearias.',
      url: 'https://barbeiro.fatura-mais.pt',
      ativo: true,
      emoji: '✂️',
    },
    {
      id: 'nails',
      nome: 'Nails',
      letra: 'N',
      cor: '#e8779a',
      corDestaque: '#ffffff',
      descricao: 'Gestão completa para estúdios de unhas.',
      url: 'https://nails.fatura-mais.pt',
      ativo: true,
      emoji: '💅',
    },
    {
      id: 'fp',
      nome: 'FP',
      letra: 'FP',
      cor: '#1e3a5f',
      corDestaque: '#c9a84c',
      descricao: 'Finanças pessoais: receitas, despesas, orçamentos e metas.',
      url: 'https://fp.fatura-mais.pt',
      ativo: true,
      emoji: '📊',
    },
    {
      id: 'lash',
      nome: 'Lash',
      letra: 'L',
      cor: '#4a148c',
      corDestaque: '#c9a96e',
      descricao: 'Para estúdios de pestanas. Em breve.',
      url: null,
      ativo: false,
      emoji: '👁️',
    },
    {
      id: 'tatuador',
      nome: 'Tattoo',
      letra: 'T',
      cor: '#111111',
      corDestaque: '#c62828',
      descricao: 'Para estúdios de tatuagem. Em breve.',
      url: null,
      ativo: false,
      emoji: '🖊️',
    },
  ]

  const features = [
    {
      icon: 'receipt_long',
      titulo: 'Faturação em tempo real',
      descricao: 'Regista serviços e vê os teus resultados ao minuto. Sem papelada, sem confusão.',
    },
    {
      icon: 'calendar_month',
      titulo: 'Marcações online',
      descricao: 'Os teus clientes marcam quando querem. Tu recebes tudo organizado no painel.',
    },
    {
      icon: 'group',
      titulo: 'CRM de clientes',
      descricao: 'Histórico completo de cada cliente — serviços, valores, frequência de visitas.',
    },
    {
      icon: 'bar_chart',
      titulo: 'Relatórios automáticos',
      descricao: 'Analisa o teu desempenho com gráficos claros. Toma decisões com dados reais.',
    },
    {
      icon: 'psychology',
      titulo: 'Conselheiro IA',
      descricao: 'Um assistente inteligente que analisa o teu negócio e dá recomendações concretas.',
    },
    {
      icon: 'euro',
      titulo: 'Controlo de despesas',
      descricao: 'Regista produtos, custos fixos e variáveis. Sabe sempre quanto tens de lucro real.',
    },
  ]

  const steps = [
    {
      n: '01',
      titulo: 'Pede acesso',
      descricao: 'Preenche o formulário com o teu nome, email e área de negócio. É gratuito e rápido.',
    },
    {
      n: '02',
      titulo: 'Ativa a tua conta',
      descricao: 'Recebes um email com link de ativação. Defines a tua password e configuras o teu negócio.',
    },
    {
      n: '03',
      titulo: 'Começa a gerir',
      descricao: 'Acedes ao painel e tens tudo disponível imediatamente. Sem curva de aprendizagem.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#fcf9f3] font-sans">
      <AuthErrorRedirect />

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="bg-[#fcf9f3]/90 backdrop-blur-xl border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/images/Logo_F_.png" alt="Fatura+" width={34} height={34} />
            <span className="font-serif italic font-bold text-[#0e4324] text-xl leading-none">
              Fatura<span className="text-[#c9a84c]">+</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://barbeiro.fatura-mais.pt/login"
              className="text-sm font-medium text-[#0e4324]/70 hover:text-[#0e4324] transition-colors hidden sm:block"
            >
              Entrar
            </a>
            <Link
              href="/pedir-acesso"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#0e4324] hover:bg-[#0e4324]/90 transition-all"
            >
              Pedir acesso
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-[#0e4324]/8 text-[#0e4324] text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] inline-block" />
          Plataforma de gestão para profissionais em Portugal
        </div>

        <h1 className="font-serif font-bold text-5xl lg:text-[64px] text-[#0e4324] leading-[1.1] mb-6 max-w-3xl mx-auto">
          O teu negócio merece mais do que uma folha de Excel.
        </h1>

        <p className="text-[#717971] text-xl leading-relaxed max-w-2xl mx-auto mb-10">
          Faturação, marcações, relatórios e IA — tudo num só lugar.
          Feito especificamente para barbearias, estúdios de beleza e profissionais independentes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/pedir-acesso"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white bg-[#0e4324] hover:bg-[#0e4324]/90 transition-all hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto justify-center"
          >
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: '20px' }}>arrow_forward</span>
            Pedir acesso gratuito
          </Link>
          <a
            href="#plataformas"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-[#0e4324] bg-[#0e4324]/8 hover:bg-[#0e4324]/12 transition-all w-full sm:w-auto justify-center"
          >
            Ver plataformas
          </a>
        </div>

        {/* Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-16 pt-10 border-t border-black/6">
          {[
            { valor: '100%', label: 'Em português' },
            { valor: 'Web', label: 'Funciona em qualquer dispositivo' },
            { valor: '24h', label: 'Ativação rápida após pedido' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-serif font-bold text-3xl text-[#0e4324]">{s.valor}</p>
              <p className="text-sm text-[#717971] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-black/5 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase text-[#c9a84c] mb-3">Funcionalidades</p>
            <h2 className="font-serif font-bold text-4xl text-[#0e4324]">Tudo o que precisas, sem o que não precisas.</h2>
            <p className="text-[#717971] text-lg mt-4 max-w-xl mx-auto">
              Desenvolvido a pensar em profissionais independentes — simples de usar, poderoso nos resultados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.titulo} className="bg-[#fcf9f3] rounded-2xl p-7 border border-black/5">
                <div className="w-11 h-11 rounded-xl bg-[#0e4324]/8 flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[#0e4324]" style={{ fontSize: '22px' }}>{f.icon}</span>
                </div>
                <h3 className="font-semibold text-[#0e4324] text-lg mb-2">{f.titulo}</h3>
                <p className="text-sm text-[#717971] leading-relaxed">{f.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase text-[#c9a84c] mb-3">Como funciona</p>
            <h2 className="font-serif font-bold text-4xl text-[#0e4324]">Pronto a usar em menos de 24 horas.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+32px)] right-0 h-px bg-[#0e4324]/10" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#0e4324] flex items-center justify-center mb-5">
                    <span className="font-serif font-bold text-[#c9a84c] text-lg">{s.n}</span>
                  </div>
                  <h3 className="font-semibold text-[#0e4324] text-lg mb-2">{s.titulo}</h3>
                  <p className="text-sm text-[#717971] leading-relaxed max-w-xs">{s.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATAFORMAS ────────────────────────────────────────────────── */}
      <section id="plataformas" className="bg-white border-y border-black/5 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase text-[#c9a84c] mb-3">Plataformas</p>
            <h2 className="font-serif font-bold text-4xl text-[#0e4324]">Qual é o teu nicho?</h2>
            <p className="text-[#717971] text-lg mt-4 max-w-xl mx-auto">
              Cada plataforma é adaptada ao teu tipo de negócio. Escolhe a tua e começa já.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {nichos.filter(n => n.ativo).map((n) => (
              <a
                key={n.id}
                href={n.url ?? '#'}
                className="group relative rounded-2xl p-7 border border-black/8 bg-[#fcf9f3] hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 block"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: n.cor }}
                >
                  <span className="font-serif font-bold italic text-lg" style={{ color: 'white' }}>
                    {n.letra}<span style={{ color: n.corDestaque === '#ffffff' ? 'rgba(255,255,255,0.6)' : n.corDestaque }}>+</span>
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl text-[#0e4324] mb-2">
                  {n.nome}<span className="text-[#c9a84c]">+</span>
                </h3>
                <p className="text-sm text-[#717971] leading-relaxed mb-5">{n.descricao}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0e4324] group-hover:gap-2.5 transition-all">
                  Aceder
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                </span>
              </a>
            ))}

            {nichos.filter(n => !n.ativo).map((n) => (
              <div
                key={n.id}
                className="relative rounded-2xl p-7 border border-black/5 bg-white/50 opacity-50 cursor-not-allowed"
              >
                <span className="absolute top-4 right-4 text-2xs font-medium bg-black/6 text-[#717971] px-2.5 py-1 rounded-full">
                  Em breve
                </span>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: n.cor }}
                >
                  <span className="font-serif font-bold italic text-lg text-white">
                    {n.letra}<span style={{ color: n.corDestaque }}>+</span>
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl text-[#0e4324] mb-2">
                  {n.nome}<span className="text-[#c9a84c]">+</span>
                </h3>
                <p className="text-sm text-[#717971] leading-relaxed">{n.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="bg-[#0e4324] rounded-3xl px-10 py-16">
            <h2 className="font-serif font-bold text-4xl text-white mb-4 leading-tight">
              Pronto para teres controlo total do teu negócio?
            </h2>
            <p className="text-white/60 text-lg mb-10 max-w-lg mx-auto">
              Junta-te aos profissionais que já gerem o seu negócio com o Fatura+.
            </p>
            <Link
              href="/pedir-acesso"
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl font-semibold text-base text-[#0e4324] bg-[#c9a84c] hover:bg-[#c9a84c]/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: '20px' }}>star</span>
              Pedir acesso agora
            </Link>
            <p className="text-white/40 text-sm mt-6">Resposta em menos de 24 horas.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-black/5 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Image src="/images/Logo_F_.png" alt="Fatura+" width={28} height={28} />
              <span className="font-serif italic font-bold text-[#0e4324] text-base leading-none">
                Fatura<span className="text-[#c9a84c]">+</span>
              </span>
            </div>
            <p className="text-xs text-[#717971]">© 2026 Fatura+ · Feito em Portugal · faturamais30@gmail.com</p>
            <div className="flex items-center gap-6">
              <Link href="/privacidade" className="text-xs text-[#717971] hover:text-[#0e4324] transition-colors">Privacidade</Link>
              <Link href="/termos" className="text-xs text-[#717971] hover:text-[#0e4324] transition-colors">Termos</Link>
              <Link href="/pedir-acesso" className="text-xs font-semibold text-[#0e4324] hover:text-[#0e4324]/70 transition-colors">Pedir acesso</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
