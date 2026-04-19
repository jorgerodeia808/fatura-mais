import Image from 'next/image'
import Link from 'next/link'

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-fundo font-sans">

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="bg-[#fcf9f3]/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 nav-link">
            <Image src="/images/Logo_F_.png" alt="Fatura+" width={36} height={36} />
            <span className="font-serif italic font-bold text-verde text-xl leading-none">
              Fatura<span className="text-dourado">+</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-sm text-ink-secondary hover:text-verde transition-colors nav-link">
              Como funciona
            </a>
            <a href="#funcionalidades" className="text-sm text-ink-secondary hover:text-verde transition-colors nav-link">
              Funcionalidades
            </a>
            <a href="#precos" className="text-sm text-ink-secondary hover:text-verde transition-colors nav-link">
              Preços
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">
              Entrar
            </Link>
            <Link href="/pedir-acesso" className="btn-primary text-sm px-4 py-2">
              Pedir acesso
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left column */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#977c30]/10 text-[#7a6325] text-xs font-medium px-3 py-1 rounded-full mb-6">
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: '14px' }}>verified</span>
              Lançamento — vagas limitadas
            </span>

            <h1 className="font-serif font-bold text-5xl lg:text-6xl text-verde leading-tight mb-6">
              A plataforma que a tua barbearia precisa
            </h1>

            <p className="text-ink-secondary text-lg leading-relaxed mb-8 max-w-lg">
              Controla faturação, despesas e marcações num único lugar. Toma decisões com base em dados reais e faz crescer o teu negócio.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/pedir-acesso" className="btn-primary px-8 py-3.5 text-base">
                Pedir acesso
              </Link>
              <a href="#como-funciona" className="btn-secondary px-8 py-3.5 text-base">
                Ver como funciona
              </a>
            </div>
          </div>

          {/* Right column */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-black/5 transform rotate-1 hover:rotate-0 transition-transform duration-500 w-full max-w-sm">
              <div className="bg-gradient-to-br from-[#0e4324] to-[#155c33] aspect-[4/5] w-full flex flex-col items-center justify-center gap-4">
                <span className="material-symbols-outlined text-white/30" style={{ fontSize: '80px' }}>content_cut</span>
                <p className="font-serif font-bold text-white text-xl tracking-wide">Premium Barbershop</p>
              </div>
              <div className="absolute bottom-6 right-[-16px] bg-white p-4 rounded-xl shadow-xl border border-black/5 min-w-[160px]">
                <p className="text-2xs font-medium uppercase tracking-widest text-ink-tertiary mb-1">Health Score médio</p>
                <p className="font-serif font-bold text-2xl text-verde leading-none mb-2">94/100</p>
                <span className="badge-green text-2xs inline-flex items-center gap-0.5">
                  <span className="material-symbols-outlined icon-filled" style={{ fontSize: '12px' }}>check_circle</span>
                  Excelente
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES GRID ────────────────────────────────────────── */}
      <section id="funcionalidades" className="bg-surface-secondary py-24">
        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-14">
            <h2 className="font-serif font-bold text-4xl text-verde mb-4">
              Tudo o que precisas, num só lugar
            </h2>
            <div className="h-0.5 w-16 bg-dourado mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 — wide */}
            <div className="card md:col-span-2 p-8 card-hover">
              <div className="w-12 h-12 bg-verde/10 rounded-xl flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-verde" style={{ fontSize: '24px' }}>payments</span>
              </div>
              <h3 className="font-serif font-bold text-2xl text-verde mb-3">Faturação em tempo real</h3>
              <p className="text-ink-secondary text-sm leading-relaxed max-w-md">
                Regista serviços e gorjetas ao segundo. Acompanha a receita diária, semanal e mensal com dashboards que atualizam em tempo real.
              </p>
            </div>

            {/* Card 2 — dark */}
            <div className="bg-verde rounded-xl p-8 md:col-span-1 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>calendar_month</span>
              </div>
              <h3 className="font-serif font-bold text-2xl text-white mb-3">Marcações inteligentes</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Organiza marcações, envia lembretes SMS automáticos e elimina faltas que custam dinheiro.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card md:col-span-1 p-8 card-hover">
              <div className="w-12 h-12 bg-verde/10 rounded-xl flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-verde" style={{ fontSize: '24px' }}>analytics</span>
              </div>
              <h3 className="font-serif font-bold text-2xl text-verde mb-3">Relatórios detalhados</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">
                Visualiza despesas, custos fixos e lucro líquido com gráficos intuitivos e exportação em PDF.
              </p>
            </div>

            {/* Card 4 — wide editorial */}
            <div className="bg-verde/5 rounded-xl p-8 md:col-span-2 relative overflow-hidden border border-black/5">
              <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-verde/5 rounded-full" />
              <div className="absolute right-16 -bottom-4 w-24 h-24 bg-dourado/10 rounded-full" />
              <div className="relative z-10">
                <p className="font-serif font-bold text-2xl text-verde mb-3 leading-snug">
                  "A tradição encontra<br />a tecnologia."
                </p>
                <p className="text-ink-secondary text-sm leading-relaxed max-w-sm">
                  Criado especificamente para barbearias que querem profissionalizar a gestão sem perder a essência do ofício.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-verde/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-verde" style={{ fontSize: '20px' }}>psychology</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Conselheiro IA incluído</p>
                    <p className="text-xs text-ink-secondary">Análise financeira automática todos os meses</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ──────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 bg-fundo">
        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-16">
            <h2 className="font-serif font-bold text-4xl text-verde mb-4">Como funciona</h2>
            <div className="h-0.5 w-16 bg-dourado mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                icon: 'handshake',
                title: 'Configuramos juntos',
                desc: 'Entras em contacto, tratamos de toda a configuração inicial. A tua barbearia fica pronta em menos de 30 minutos.',
              },
              {
                step: '02',
                icon: 'edit_note',
                title: 'Registas o dia-a-dia',
                desc: 'Registas faturação, despesas e marcações facilmente. O dashboard atualiza em tempo real para teres visão total.',
              },
              {
                step: '03',
                icon: 'insights',
                title: 'A IA analisa e sugere',
                desc: 'O conselheiro IA analisa a tua performance mensal e sugere melhorias concretas para maximizar o lucro.',
              },
            ].map((item) => (
              <div key={item.step} className="relative pt-8">
                <span className="font-serif font-bold text-7xl text-verde/10 absolute top-0 left-0 leading-none select-none">
                  {item.step}
                </span>
                <div className="relative z-10 pt-10">
                  <div className="w-11 h-11 bg-verde/10 rounded-xl flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-verde" style={{ fontSize: '22px' }}>{item.icon}</span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-verde mb-2">{item.title}</h3>
                  <p className="text-ink-secondary text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ─────────────────────────────────────────────────────── */}
      <section id="precos" className="bg-surface-secondary py-24">
        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-14">
            <h2 className="font-serif font-bold text-4xl text-verde mb-4">Preço simples e transparente</h2>
            <div className="h-0.5 w-16 bg-dourado mx-auto mb-6" />
            <p className="text-ink-secondary text-sm max-w-md mx-auto">
              Um plano. Tudo incluído. Sem surpresas.
            </p>
          </div>

          {/* Single plan card — centred */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-8 border-2 border-dourado relative"
                 style={{ boxShadow: '0 8px 40px rgba(151,124,48,0.12)' }}>

              <p className="text-sm font-medium text-ink-secondary mb-1">Plano Mensal</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="font-serif font-bold text-5xl text-ink">€14</span>
                <span className="font-serif font-bold text-2xl text-ink">,99</span>
                <span className="text-ink-secondary text-sm">/mês</span>
              </div>
              <p className="text-xs text-ink-tertiary mb-6">cancela quando quiseres</p>

              <Link href="/pedir-acesso" className="btn-dourado w-full justify-center mb-8 py-3">
                Pedir acesso
              </Link>

              <ul className="space-y-3">
                {[
                  'Faturação ilimitada',
                  'Marcações e lembretes SMS',
                  'Relatórios mensais completos',
                  'Conselheiro IA incluído',
                  'Configuração inicial gratuita',
                  'Suporte direto por WhatsApp',
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2.5 text-sm text-ink">
                    <span className="material-symbols-outlined icon-filled text-verde" style={{ fontSize: '18px' }}>check_circle</span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-fundo">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-verde rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/5 rounded-full" />
            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute top-8 right-24 w-16 h-16 bg-white/5 rounded-full" />

            <div className="relative z-10">
              <h2 className="font-serif font-bold text-4xl text-white mb-4 leading-tight">
                Queres ter a tua barbearia<br />sob controlo?
              </h2>
              <p className="text-white/80 text-base mb-10 max-w-lg mx-auto leading-relaxed">
                Fala connosco hoje. Configuramos tudo juntos e a tua barbearia fica operacional em menos de uma hora.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/pedir-acesso"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg font-medium text-white transition-all hover:opacity-90 active:scale-[0.99] bg-[#977c30]"
                  style={{ minHeight: 'unset' }}
                >
                  Pedir acesso
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md font-medium text-sm text-white border border-white/30 hover:bg-white/10 transition-all duration-200"
                  style={{ minHeight: 'unset' }}
                >
                  Já tenho conta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-surface-secondary border-t border-black/5 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Image src="/images/Logo_F_.png" alt="Fatura+" width={32} height={32} />
              <span className="font-serif italic font-bold text-verde text-lg leading-none">
                Fatura<span className="text-dourado">+</span>
              </span>
            </div>
            <p className="text-xs text-ink-tertiary text-center">
              © 2026 Fatura+ · faturamais30@gmail.com
            </p>
            <div className="flex items-center gap-5">
              <Link href="/privacidade" className="text-xs text-ink-secondary hover:text-verde transition-colors nav-link">Privacidade</Link>
              <Link href="/termos" className="text-xs text-ink-secondary hover:text-verde transition-colors nav-link">Termos</Link>
              <Link href="/cookies" className="text-xs text-ink-secondary hover:text-verde transition-colors nav-link">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
