import Image from 'next/image'
import Link from 'next/link'

export default function PrivacidadePage() {
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
          Política de Privacidade
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Última atualização: abril de 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          {/* Seção 1 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              1. Responsável pelo Tratamento
            </h2>
            <p>
              O responsável pelo tratamento dos dados pessoais recolhidos através
              da plataforma Fatura+ é:
            </p>
            <div className="bg-white border border-gray-200 rounded-lg p-4 mt-3 space-y-1">
              <p><strong>Fatura+</strong></p>
              <p>NIF: XXXXXXXXX</p>
              <p>
                Email:{' '}
                <a
                  href="mailto:suporte@fatura-mais.pt"
                  className="text-[#0e4324] underline"
                >
                  suporte@fatura-mais.pt
                </a>
              </p>
              <p>Portugal</p>
            </div>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              2. Dados Recolhidos
            </h2>
            <p>
              No âmbito da prestação do nosso serviço, recolhemos os seguintes
              dados pessoais:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Dados de identificação:</strong> nome completo, endereço
                de email e número de telefone, fornecidos no momento do registo.
              </li>
              <li>
                <strong>Dados de faturação:</strong> NIF da barbearia, morada
                de faturação e histórico de transações efetuadas na plataforma.
              </li>
              <li>
                <strong>Dados de utilização:</strong> registos de acesso,
                endereço IP, tipo de browser, sistema operativo e páginas
                visitadas dentro da aplicação.
              </li>
              <li>
                <strong>Dados financeiros da barbearia:</strong> receitas,
                despesas e demais informações inseridas pelo utilizador para
                efeitos de gestão.
              </li>
              <li>
                <strong>Cookies e dados de sessão:</strong> conforme descrito
                na nossa{' '}
                <Link href="/cookies" className="text-[#0e4324] underline">
                  Política de Cookies
                </Link>
                .
              </li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              3. Finalidade do Tratamento
            </h2>
            <p>Os dados são tratados para as seguintes finalidades:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Prestação e manutenção do serviço Fatura+, incluindo autenticação,
                gestão de conta e suporte técnico.
              </li>
              <li>
                Faturação e cobrança dos planos subscritos pelo utilizador.
              </li>
              <li>
                Envio de comunicações transacionais (confirmações, alertas de
                expiração, recibos).
              </li>
              <li>
                Melhoria contínua da plataforma através da análise de padrões
                de utilização, de forma anonimizada sempre que possível.
              </li>
              <li>
                Cumprimento de obrigações legais e fiscais aplicáveis.
              </li>
            </ul>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              4. Base Legal
            </h2>
            <p>
              O tratamento dos teus dados pessoais baseia-se nas seguintes bases
              jurídicas, nos termos do Regulamento Geral sobre a Proteção de
              Dados (RGPD — Regulamento (UE) 2016/679):
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Execução de contrato</strong> (art. 6.º, n.º 1, al. b)):
                para prestar o serviço contratado e gerir a conta do utilizador.
              </li>
              <li>
                <strong>Obrigação legal</strong> (art. 6.º, n.º 1, al. c)):
                para cumprir obrigações fiscais e legais.
              </li>
              <li>
                <strong>Interesse legítimo</strong> (art. 6.º, n.º 1, al. f)):
                para melhorar o serviço e prevenir fraudes.
              </li>
              <li>
                <strong>Consentimento</strong> (art. 6.º, n.º 1, al. a)):
                para o envio de comunicações de marketing, quando aplicável.
              </li>
            </ul>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              5. Conservação dos Dados
            </h2>
            <p>
              Os dados pessoais são conservados durante o período necessário para
              as finalidades que justificaram a sua recolha, nomeadamente:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Dados de conta: enquanto a conta estiver ativa e durante 5 anos
                após o encerramento, para efeitos legais e fiscais.
              </li>
              <li>
                Dados de faturação: 10 anos, conforme exigido pela legislação
                fiscal portuguesa.
              </li>
              <li>
                Dados de utilização e logs: até 12 meses após o registo.
              </li>
            </ul>
            <p className="mt-2">
              Findo o prazo de conservação, os dados são eliminados de forma
              segura ou anonimizados.
            </p>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              6. Direitos do Utilizador
            </h2>
            <p>
              Ao abrigo do RGPD, tens os seguintes direitos relativamente aos teus
              dados pessoais:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Direito de acesso:</strong> obteres confirmação sobre se
                os teus dados são tratados e acederes a uma cópia dos mesmos.
              </li>
              <li>
                <strong>Direito de retificação:</strong> corrigires dados
                incorretos ou incompletos.
              </li>
              <li>
                <strong>Direito ao apagamento:</strong> solicitares a eliminação
                dos teus dados, quando aplicável.
              </li>
              <li>
                <strong>Direito de oposição:</strong> opores-te ao tratamento
                baseado em interesse legítimo.
              </li>
              <li>
                <strong>Direito à portabilidade:</strong> receberes os teus dados
                num formato estruturado e legível por máquina.
              </li>
              <li>
                <strong>Direito de limitação:</strong> solicitares a restrição do
                tratamento em determinadas circunstâncias.
              </li>
            </ul>
            <p className="mt-2">
              Tens também o direito de apresentar reclamação junto da Comissão
              Nacional de Proteção de Dados (CNPD) em{' '}
              <a
                href="https://www.cnpd.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0e4324] underline"
              >
                www.cnpd.pt
              </a>
              .
            </p>
          </section>

          {/* Seção 7 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              7. Contacto
            </h2>
            <p>
              Para exerceres os teus direitos ou esclareceres qualquer dúvida
              sobre o tratamento dos teus dados, podes contactar-nos através de:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Email:{' '}
                <a
                  href="mailto:suporte@fatura-mais.pt"
                  className="text-[#0e4324] underline"
                >
                  suporte@fatura-mais.pt
                </a>
              </li>
              <li>
                WhatsApp:{' '}
                <a
                  href="https://wa.me/351XXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0e4324] underline"
                >
                  +351 XXX XXX XXX
                </a>
              </li>
            </ul>
            <p className="mt-2">
              Responderemos ao teu pedido no prazo máximo de 30 dias.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© 2026 Fatura+ · NIF: XXXXXXXXX · suporte@fatura-mais.pt</p>
          <div className="flex gap-4">
            <Link href="/termos" className="hover:text-[#0e4324] transition-colors">
              Termos de Serviço
            </Link>
            <Link href="/cookies" className="hover:text-[#0e4324] transition-colors">
              Política de Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
