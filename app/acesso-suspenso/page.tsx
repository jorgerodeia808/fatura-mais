import Image from 'next/image'
import Link from 'next/link'

export default function AcessoSuspensoPag() {
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
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-red-600" style={{ fontSize: '32px' }}>block</span>
          </div>

          <h1 className="font-serif font-bold text-2xl text-[#1c1c18] mb-2">Conta suspensa</h1>
          <p className="text-sm text-[#717971] leading-relaxed mb-8">
            A tua conta foi temporariamente suspensa. Contacta-nos para resolver a situação.
          </p>

          {/* WhatsApp CTA */}
          <a
            href="https://wa.me/351XXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-medium text-white mb-3 transition-all hover:opacity-90"
            style={{ background: '#25D366' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Falar connosco no WhatsApp
          </a>

          {/* Email button */}
          <a
            href="mailto:suporte@fatura-mais.pt"
            className="btn-secondary w-full flex items-center justify-center gap-2 mb-6"
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            suporte@fatura-mais.pt
          </a>

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
