import Image from 'next/image'
import Link from 'next/link'

export default function AcessoExpiradoPage() {
  return (
    <div className="min-h-screen bg-[#fcf9f3] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo centered */}
        <div className="text-center mb-8">
          <Image src="/images/Logo_F_.png" alt="Fatura+" width={64} height={64} className="mx-auto mb-4" />
          <p className="font-serif italic font-bold text-xl text-[#0e4324]">
            Fatura<span className="text-[#977c30]">+</span>
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl p-8 text-center"
          style={{ border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '32px' }}>lock_clock</span>
          </div>

          <h1 className="font-serif font-bold text-2xl text-[#1c1c18] mb-2">O teu trial expirou</h1>
          <p className="text-sm text-[#717971] leading-relaxed mb-8">
            O teu período de teste de 14 dias terminou. Para continuares a usar o Fatura+, fala connosco — tratamos de tudo.
          </p>

          {/* Monthly plan only — NO mention of €50 */}
          <div className="bg-[#f0eee8] rounded-xl p-5 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <p className="font-serif font-semibold text-lg text-[#1c1c18]">Plano Mensal</p>
              <span className="badge-gold text-xs">Recomendado</span>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="font-serif font-bold text-4xl text-[#0e4324]">€14,99</span>
              <span className="text-sm text-[#717971]">/mês</span>
            </div>
            <ul className="space-y-2">
              {['Acesso completo', 'Todas as funcionalidades', 'Cancela quando quiseres', 'Suporte incluído'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-[#717971]">
                  <span className="material-symbols-outlined icon-filled text-[#0e4324] text-[14px]">check_circle</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/pedir-acesso"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-medium text-white mb-3 transition-all hover:opacity-90"
            style={{ background: '#0e4324' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
            Contactar para renovar
          </Link>

          <Link href="/login" className="text-sm text-[#717971] hover:text-[#1c1c18] transition-colors">
            ← Voltar ao login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-2xs text-[#717971]/50 mt-6">
          © 2026 Fatura+ · NIF: XXXXXXXXX · suporte@fatura-mais.pt
        </p>
      </div>
    </div>
  )
}
