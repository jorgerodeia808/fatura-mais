export default function ConfirmarEmailPage() {
  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-2xl bg-verde flex items-center justify-center font-bold text-5xl text-dourado shadow-lg mx-auto mb-6">
          F
        </div>

        <div className="card">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-verde mb-2">Confirma o teu email</h2>
          <p className="text-gray-500 text-sm mb-4">
            Enviámos um link de confirmação para o teu email. Clica no link para ativares a tua conta e depois faz login.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Não recebeste? Verifica a pasta de spam.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center w-full bg-verde text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0a3019] transition-colors"
          >
            Ir para o Login
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Podes fechar esta página. O link de confirmação foi enviado para o teu email.
        </p>
      </div>
    </div>
  )
}
