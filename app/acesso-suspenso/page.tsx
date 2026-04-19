import Image from 'next/image'
import Link from 'next/link'

export default function AcessoSuspensoPag() {
  return (
    <div className="min-h-screen bg-[#fcf9f3] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Image src="/images/Logo_F_.png" alt="Fatura+" width={64} height={64} className="mx-auto mb-4" />
          <p className="font-serif italic font-bold text-xl text-[#0e4324]">
            Fatura<span className="text-[#977c30]">+</span>
          </p>
        </div>

        <div
          className="bg-white rounded-2xl p-8 text-center"
          style={{ border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-red-600" style={{ fontSize: '32px' }}>block</span>
          </div>

          <h1 className="font-serif font-bold text-2xl text-[#1c1c18] mb-2">Conta suspensa</h1>
          <p className="text-sm text-[#717971] leading-relaxed mb-8">
            A tua conta foi temporariamente suspensa. Entra em contacto connosco para resolver a situação.
          </p>

          <a
            href="mailto:faturamais30@gmail.com?subject=Conta%20suspensa"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-medium text-white mb-3 transition-all hover:opacity-90"
            style={{ background: '#0e4324' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
            faturamais30@gmail.com
          </a>

          <Link href="/login" className="text-sm text-[#717971] hover:text-[#1c1c18] transition-colors">
            ← Voltar ao login
          </Link>
        </div>

        <p className="text-center text-2xs text-[#717971]/50 mt-6">
          © 2026 Fatura+ · faturamais30@gmail.com
        </p>
      </div>
    </div>
  )
}
