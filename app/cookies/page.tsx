import Image from 'next/image'
import Link from 'next/link'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/images/Logo_F_.png"
              alt="Fatura+ Logo"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-bold text-[#0e4324] text-lg">Fatura+</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[#0e4324] mb-2">
          Política de Cookies
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Última atualização: abril de 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          {/* Seção 1 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              1. O que são Cookies?
            </h2>
            <p>
              Cookies são pequenos ficheiros de texto que são armazenados no teu
              dispositivo (computador, tablet ou telemóvel) quando visitas um
              website ou utilizas uma aplicação web. Permitem que o site se
              "lembre" das tuas preferências e ações ao longo do tempo, melhorando
              a tua experiência de utilização.
            </p>
            <p className="mt-2">
              Os cookies podem ser de sessão (eliminados quando fechas o browser)
              ou persistentes (mantidos por um período determinado ou até que os
              elimines manualmente).
            </p>
            <p className="mt-2">
              Além de cookies, podemos também utilizar tecnologias similares como
              armazenamento local (localStorage) para guardar as tuas preferências
              de consentimento.
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              2. Que Cookies Utilizamos?
            </h2>

            {/* Cookies essenciais */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#0e4324]"></span>
                Cookies Essenciais
              </h3>
              <p className="mb-3">
                Estes cookies são necessários para o funcionamento básico da
                plataforma e não podem ser desativados. Sem eles, partes do
                serviço podem não funcionar corretamente.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 border border-gray-200 font-semibold">Nome</th>
                      <th className="text-left p-2 border border-gray-200 font-semibold">Finalidade</th>
                      <th className="text-left p-2 border border-gray-200 font-semibold">Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-gray-200 font-mono">session_token</td>
                      <td className="p-2 border border-gray-200">Autenticação e manutenção da sessão do utilizador</td>
                      <td className="p-2 border border-gray-200">Sessão</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-2 border border-gray-200 font-mono">csrf_token</td>
                      <td className="p-2 border border-gray-200">Proteção contra ataques CSRF</td>
                      <td className="p-2 border border-gray-200">Sessão</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-gray-200 font-mono">cookie-consent</td>
                      <td className="p-2 border border-gray-200">Registo das preferências de cookies do utilizador</td>
                      <td className="p-2 border border-gray-200">1 ano</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-2 border border-gray-200 font-mono">locale</td>
                      <td className="p-2 border border-gray-200">Preferências de idioma e região</td>
                      <td className="p-2 border border-gray-200">1 ano</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cookies de analítica */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#977c30]"></span>
                Cookies de Analítica
              </h3>
              <p className="mb-3">
                Estes cookies ajudam-nos a compreender como os utilizadores
                interagem com a plataforma, permitindo-nos melhorar a experiência
                e o desempenho do serviço. A recolha é efetuada de forma
                anonimizada sempre que possível. Só são ativados com o teu
                consentimento.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 border border-gray-200 font-semibold">Nome</th>
                      <th className="text-left p-2 border border-gray-200 font-semibold">Finalidade</th>
                      <th className="text-left p-2 border border-gray-200 font-semibold">Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-gray-200 font-mono">_va</td>
                      <td className="p-2 border border-gray-200">Vercel Analytics — análise de utilização anónima</td>
                      <td className="p-2 border border-gray-200">2 anos</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-2 border border-gray-200 font-mono">_va_ses</td>
                      <td className="p-2 border border-gray-200">Vercel Analytics — identificador de sessão</td>
                      <td className="p-2 border border-gray-200">30 min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Utilizamos o Vercel Analytics para recolher dados de utilização
                de forma anonimizada. Não são recolhidos dados pessoais
                identificáveis através desta ferramenta.
              </p>
            </div>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              3. Como Gerir os Cookies
            </h2>
            <p>
              Quando visitas o Fatura+ pela primeira vez, é-te apresentado um
              aviso de cookies que te permite escolher as tuas preferências:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>"Só essenciais"</strong> — aceita apenas os cookies
                necessários para o funcionamento da plataforma.
              </li>
              <li>
                <strong>"Aceitar todos"</strong> — aceita todos os cookies,
                incluindo os de analítica.
              </li>
            </ul>
            <p className="mt-3">
              Podes alterar as tuas preferências a qualquer momento limpando o
              armazenamento local do browser (chave <code className="bg-gray-100 px-1 rounded text-xs">cookie-consent</code>) ou
              contactando-nos.
            </p>
            <p className="mt-3">
              Podes também gerir ou eliminar cookies diretamente no teu browser.
              Consulta as instruções do teu browser:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0e4324] underline"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/pt-PT/kb/gerir-cookies-e-dados-de-site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0e4324] underline"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/pt-pt/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0e4324] underline"
                >
                  Safari
                </a>
              </li>
            </ul>
            <p className="mt-3">
              Atenção: desativar cookies essenciais pode comprometer o
              funcionamento correto da plataforma.
            </p>
            <p className="mt-3">
              Para mais informações ou para exerceres os teus direitos ao abrigo
              do RGPD, consulta a nossa{' '}
              <Link href="/privacidade" className="text-[#0e4324] underline">
                Política de Privacidade
              </Link>{' '}
              ou contacta-nos em{' '}
              <a
                href="mailto:suporte@fatura-mais.pt"
                className="text-[#0e4324] underline"
              >
                suporte@fatura-mais.pt
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© 2026 Fatura+</p>
          <div className="flex gap-4">
            <Link href="/privacidade" className="hover:text-[#0e4324] transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="hover:text-[#0e4324] transition-colors">
              Termos de Serviço
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
