import Image from 'next/image'
import Link from 'next/link'

export default function AcessoExpiradoPage() {
  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <Image
              src="/images/Logo_F_.png"
              alt="Fatura+ Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>

          {/* Título da app */}
          <p className="text-[#977c30] font-semibold tracking-wide text-sm uppercase mb-6">
            Fatura+
          </p>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-[#0e4324] mb-3">
            O teu trial expirou
          </h1>

          {/* Descrição */}
          <p className="text-gray-600 text-sm leading-relaxed mb-8">
            O teu período de teste de 14 dias terminou. Para continuares a usar o
            Fatura+, escolhe um plano.
          </p>

          {/* Planos */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Plano Vitalício */}
            <div className="border-2 border-[#0e4324] rounded-xl p-5 text-left relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0e4324] text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                Mais popular
              </span>
              <h2 className="text-[#0e4324] font-bold text-base mb-1">Vitalício</h2>
              <p className="text-2xl font-extrabold text-gray-900 mb-0.5">
                €50
              </p>
              <p className="text-xs text-gray-500 mb-4">pagamento único</p>
              <ul className="space-y-1.5 text-xs text-gray-700">
                <li className="flex items-center gap-1.5">
                  <span className="text-[#0e4324] font-bold">✓</span>
                  Acesso permanente
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#0e4324] font-bold">✓</span>
                  Todas as funcionalidades
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#0e4324] font-bold">✓</span>
                  Atualizações incluídas
                </li>
              </ul>
            </div>

            {/* Plano Mensal */}
            <div className="border border-gray-200 rounded-xl p-5 text-left">
              <h2 className="text-gray-800 font-bold text-base mb-1">Mensal</h2>
              <p className="text-2xl font-extrabold text-gray-900 mb-0.5">
                €14.99
              </p>
              <p className="text-xs text-gray-500 mb-4">/mês</p>
              <ul className="space-y-1.5 text-xs text-gray-700">
                <li className="flex items-center gap-1.5">
                  <span className="text-[#0e4324] font-bold">✓</span>
                  Cancela quando quiser
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#0e4324] font-bold">✓</span>
                  Todas as funcionalidades
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#0e4324] font-bold">✓</span>
                  Suporte incluído
                </li>
              </ul>
            </div>
          </div>

          {/* Botão WhatsApp */}
          <a
            href="https://wa.me/351XXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors duration-200 mb-3"
          >
            {/* Ícone WhatsApp inline SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Falar com o suporte no WhatsApp
          </a>

          <p className="text-sm text-gray-500 mb-6">
            Tens dúvidas? Fala connosco
          </p>

          {/* Link voltar ao login */}
          <Link
            href="/login"
            className="text-sm text-[#0e4324] hover:underline font-medium"
          >
            ← Voltar ao login
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-400 space-y-1">
        <p>© 2026 Fatura+ · NIF: XXXXXXXXX · suporte@fatura-mais.pt</p>
      </footer>
    </div>
  )
}
