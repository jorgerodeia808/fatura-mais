import Image from 'next/image'
import Link from 'next/link'

export default function AcessoSuspensoPag({
  searchParams,
}: {
  searchParams: { motivo?: string; renovacao?: string }
}) {
  const expirado = searchParams.motivo === 'expirado'
  const renovacao = searchParams.renovacao

  const dataFormatada = renovacao
    ? new Date(renovacao).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

  const emailSubject = expirado
    ? 'Renovação%20de%20subscrição'
    : 'Conta%20suspensa'

  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Image src="/images/Logo_F_.png" alt="Fatura+" width={64} height={64} className="mx-auto mb-4" />
          <p className="font-serif italic font-bold text-xl text-verde">
            Fatura<span className="text-dourado">+</span>
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-red-600" style={{ fontSize: '32px' }}>
              {expirado ? 'schedule' : 'block'}
            </span>
          </div>

          <h1 className="font-serif font-bold text-2xl text-ink mb-2">
            {expirado ? 'Subscrição expirada' : 'Conta suspensa'}
          </h1>

          {expirado ? (
            <div className="mb-6 space-y-1">
              <p className="text-sm text-ink-secondary leading-relaxed">
                A tua subscrição mensal expirou{dataFormatada ? ` em ${dataFormatada}` : ''}.
              </p>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Entra em contacto para renovar e retomar o acesso.
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-secondary leading-relaxed mb-6">
              A tua conta foi temporariamente suspensa. Entra em contacto connosco para resolver a situação.
            </p>
          )}

          <a
            href={`mailto:faturamais30@gmail.com?subject=${emailSubject}`}
            className="btn-primary w-full mb-3"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
            faturamais30@gmail.com
          </a>

          <Link href="/login" className="text-sm text-ink-secondary hover:text-ink transition-colors">
            ← Voltar ao login
          </Link>
        </div>

        <p className="text-center text-2xs text-ink/40 mt-6">
          © 2026 Fatura+ · faturamais30@gmail.com
        </p>
      </div>
    </div>
  )
}
