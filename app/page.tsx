import Link from 'next/link'

function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-10 h-10 text-xl', md: 'w-16 h-16 text-3xl', lg: 'w-24 h-24 text-5xl' }
  return (
    <div className={`${sizes[size]} rounded-2xl bg-verde flex items-center justify-center font-bold text-dourado shadow-lg`}>
      F
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-fundo">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-xl font-bold text-verde">Fatura<span className="text-dourado">+</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-verde font-medium hover:text-dourado transition-colors px-4 py-2">
            Entrar
          </Link>
          <Link href="/registo" className="btn-primary text-sm px-5 py-2.5">
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          <div className="inline-flex items-center gap-2 bg-verde/10 text-verde text-sm font-medium px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-dourado rounded-full"></span>
            Gestão financeira simples e eficiente
          </div>

          <h1 className="text-5xl font-bold text-verde leading-tight mb-6">
            A plataforma que a tua{' '}
            <span className="text-dourado">barbearia</span>{' '}
            precisa
          </h1>

          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Controla a faturação, despesas, barbeiros e marcações num único lugar.
            Toma decisões com base em dados reais e faz crescer o teu negócio.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/registo" className="btn-primary text-base px-8 py-4">
              Começar grátis
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-4">
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          {[
            {
              icon: '💰',
              title: 'Faturação em tempo real',
              desc: 'Regista serviços, gorjetas e acompanha a receita diária, semanal e mensal.',
            },
            {
              icon: '📊',
              title: 'Relatórios detalhados',
              desc: 'Visualiza despesas, custos fixos e lucro líquido com dashboards intuitivos.',
            },
            {
              icon: '📅',
              title: 'Gestão de marcações',
              desc: 'Organiza marcações e envia lembretes automáticos aos clientes.',
            },
          ].map((f) => (
            <div key={f.title} className="card hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-verde mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-verde font-semibold">Fatura<span className="text-dourado">+</span></span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 Fatura+. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
