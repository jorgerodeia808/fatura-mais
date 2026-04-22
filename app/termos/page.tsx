import Image from 'next/image'
import Link from 'next/link'

export default function TermosPage() {
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
          Termos de Serviço
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Última atualização: abril de 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          {/* Seção 1 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              1. Serviço
            </h2>
            <p>
              O Fatura+ é uma plataforma SaaS (Software as a Service) de gestão
              financeira concebida especificamente para barbearias, que inclui
              funcionalidades de controlo de faturação, registo de despesas,
              gestão de marcações e um conselheiro financeiro com inteligência
              artificial.
            </p>
            <p className="mt-2">
              Ao criar uma conta e utilizar o Fatura+, aceitas ficar vinculado
              pelos presentes Termos de Serviço. Se não concordares com estes
              termos, não deves utilizar a plataforma.
            </p>
            <p className="mt-2">
              O Fatura+ reserva-se o direito de alterar estes termos a qualquer
              momento, notificando os utilizadores por email com antecedência
              mínima de 30 dias em caso de alterações materiais.
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              2. Planos e Preços
            </h2>
            <p>
              O Fatura+ opera por convite. O acesso é concedido mediante contacto direto com a equipa, que configura a conta e ativa o plano escolhido.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mt-4 max-w-xs">
              {/* Mensal */}
              <div className="bg-white border-2 border-[#0e4324] rounded-lg p-4">
                <h3 className="font-semibold text-[#0e4324] mb-1">Mensal</h3>
                <p className="text-xl font-bold text-gray-900">€12,99</p>
                <p className="text-xs text-gray-500 mb-2">/mês</p>
                <p className="text-xs text-gray-600">
                  Acesso mensal renovado automaticamente. Cancelamento disponível
                  a qualquer momento sem penalizações.
                </p>
              </div>
            </div>

            <p className="mt-4">
              Os preços apresentados incluem IVA à taxa legal em vigor em
              Portugal. O Fatura+ reserva-se o direito de alterar os preços,
              mediante notificação prévia de 30 dias aos utilizadores ativos.
            </p>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              3. Pagamentos
            </h2>
            <p>
              Os pagamentos são processados por prestadores de serviços de
              pagamento certificados e seguros. O Fatura+ não armazena dados
              de cartões de crédito ou débito.
            </p>
            <p className="mt-2">
              Para o plano mensal, a cobrança é efetuada no dia de início da
              subscrição e renovada automaticamente em igual data nos meses
              seguintes. Em caso de falha no pagamento, o acesso poderá ser
              suspenso após aviso prévio.
            </p>
            <p className="mt-2">
              Recibos e faturas são emitidos por email após cada cobrança
              bem-sucedida.
            </p>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              4. Cancelamento
            </h2>
            <p>
              O utilizador pode cancelar a subscrição mensal a qualquer momento
              através das definições da conta ou por contacto com o suporte. O
              cancelamento produz efeitos no final do período de faturação em
              curso, sem direito a reembolso proporcional.
            </p>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              5. Limitações de Responsabilidade
            </h2>
            <p>
              O Fatura+ é disponibilizado "tal como está" e "conforme
              disponível". Envidamos todos os esforços para garantir a
              disponibilidade e fiabilidade do serviço, mas não garantimos
              disponibilidade ininterrupta ou ausência de erros.
            </p>
            <p className="mt-2">
              O Fatura+ não se responsabiliza por perdas de dados resultantes de
              falhas técnicas, erros do utilizador ou eventos de força maior.
              Recomendamos que exportes regularmente os teus dados.
            </p>
            <p className="mt-2">
              As sugestões fornecidas pelo conselheiro financeiro IA têm carácter
              meramente informativo e não constituem aconselhamento financeiro,
              fiscal ou legal. O utilizador é responsável pelas decisões tomadas
              com base nessa informação.
            </p>
            <p className="mt-2">
              A responsabilidade total do Fatura+ perante o utilizador, a qualquer
              título, não excederá o montante pago pelo utilizador nos últimos
              12 meses.
            </p>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="text-lg font-semibold text-[#0e4324] mb-3">
              6. Lei Aplicável e Foro Competente
            </h2>
            <p>
              Os presentes Termos de Serviço são regidos pela lei portuguesa.
              Qualquer litígio emergente da interpretação ou execução destes
              termos será submetido aos tribunais competentes da comarca de
              Lisboa, com expressa renúncia a qualquer outro foro.
            </p>
            <p className="mt-2">
              Para utilizadores consumidores, é reconhecido o direito de recurso
              à plataforma europeia de resolução de litígios em linha (ODR),
              disponível em{' '}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0e4324] underline"
              >
                ec.europa.eu/consumers/odr
              </a>
              .
            </p>
            <p className="mt-2">
              Para questões ou reclamações, contacta-nos em{' '}
              <a
                href="mailto:faturamais30@gmail.com"
                className="text-[#0e4324] underline"
              >
                faturamais30@gmail.com
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
            <Link href="/cookies" className="hover:text-[#0e4324] transition-colors">
              Política de Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
