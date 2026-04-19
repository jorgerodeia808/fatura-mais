import Image from 'next/image'
import Link from 'next/link'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/images/Logo_F_.png" alt="Fatura+ Logo" width={36} height={36} className="object-contain" />
            <span className="font-bold text-[#0e4324] text-lg">Fatura+</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[#0e4324] mb-2">Política de Cookies</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: abril de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">1. O que são Cookies?</h2>
            <p>
              Cookies são pequenos ficheiros de texto que são colocados no teu dispositivo quando visitas um website.
              Permitem que o site reconheça o teu dispositivo e se lembre de informações sobre a tua visita,
              como o facto de teres sessão iniciada.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">2. Cookies que Utilizamos</h2>
            <p>O Fatura+ utiliza exclusivamente cookies estritamente necessários para o funcionamento da plataforma:</p>

            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Nome</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Finalidade</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Duração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">sb-*</td>
                    <td className="px-4 py-3">Sessão de autenticação. Mantém o utilizador autenticado entre páginas.</td>
                    <td className="px-4 py-3">Sessão / 7 dias</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">__Host-next-auth.*</td>
                    <td className="px-4 py-3">Segurança da sessão. Previne ataques CSRF.</td>
                    <td className="px-4 py-3">Sessão</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              Não utilizamos cookies de publicidade, rastreamento de terceiros, nem cookies de análise
              que identifiquem utilizadores individualmente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">3. Serviços de Terceiros</h2>
            <p>A plataforma utiliza os seguintes serviços que podem colocar tecnologias semelhantes a cookies:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Supabase</strong> — autenticação e base de dados. Os cookies de sessão são necessários para manter o estado autenticado.</li>
              <li><strong>Vercel Analytics</strong> — análise de desempenho anónima e agregada, sem identificação de utilizadores individuais.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">4. Como Gerir os Cookies</h2>
            <p>
              Como os cookies que utilizamos são estritamente necessários para o funcionamento do serviço,
              não é possível desativá-los sem perder a capacidade de utilizar a plataforma.
            </p>
            <p className="mt-2">
              Podes eliminar cookies através das definições do teu browser. Ao eliminares os cookies de sessão,
              serás desautenticado e terás de iniciar sessão novamente.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3 space-y-1 text-xs">
              <p><strong>Chrome:</strong> Definições → Privacidade e segurança → Cookies e outros dados de sites</p>
              <p><strong>Firefox:</strong> Opções → Privacidade e Segurança → Cookies e dados de sites</p>
              <p><strong>Safari:</strong> Preferências → Privacidade → Gerir dados de websites</p>
              <p><strong>Edge:</strong> Definições → Cookies e permissões de site</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">5. Contacto</h2>
            <p>Para qualquer questão sobre cookies, contacta-nos em:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Email: <a href="mailto:faturamais30@gmail.com" className="text-[#0e4324] underline">faturamais30@gmail.com</a></li>
              <li>WhatsApp: <a href="https://wa.me/351934089768" target="_blank" rel="noopener noreferrer" className="text-[#0e4324] underline">+351 934 089 768</a></li>
            </ul>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© 2026 Fatura+ · faturamais30@gmail.com</p>
          <div className="flex gap-4">
            <Link href="/privacidade" className="hover:text-[#0e4324] transition-colors">Política de Privacidade</Link>
            <Link href="/termos" className="hover:text-[#0e4324] transition-colors">Termos de Serviço</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
