'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const SMS_TEMPLATE_PADRAO =
  'Olá [nome_cliente]! Lembrete da tua marcação em [nome_barbearia] amanhã, [data] às [hora] para [nome_servico]. Até amanhã!'

const VARIAVEIS = ['[nome_cliente]', '[nome_barbearia]', '[data]', '[hora]', '[nome_servico]']

interface Barbearia {
  id: string
  nome: string
  sms_ativo: boolean | null
  sms_mensagem_personalizada: string | null
  marcacoes_online: boolean | null
  slug: string | null
}

function Toggle({ value, onChange, disabled = false }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => onChange(!value)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${value ? 'bg-[#0e4324]' : 'bg-gray-200'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-[#0e4324]">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  // SMS state
  const [smsAtivo, setSmsAtivo] = useState(true)
  const [smsMensagem, setSmsMensagem] = useState(SMS_TEMPLATE_PADRAO)
  const [testeNumero, setTesteNumero] = useState('')
  const [enviandoTeste, setEnviandoTeste] = useState(false)

  // Marcações online state
  const [marcacoesOnline, setMarcacoesOnline] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const carregarBarbearia = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('barbearias')
      .select('id, nome, sms_ativo, sms_mensagem_personalizada, marcacoes_online, slug')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setBarbearia(data as Barbearia)
      setSmsAtivo(data.sms_ativo !== false)
      setSmsMensagem(data.sms_mensagem_personalizada || SMS_TEMPLATE_PADRAO)
      setMarcacoesOnline(data.marcacoes_online ?? false)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { carregarBarbearia() }, [carregarBarbearia])

  const guardar = async (campo: string, valor: unknown) => {
    if (!barbearia) return
    setSaving(campo)
    const { error } = await supabase
      .from('barbearias')
      .update({ [campo]: valor })
      .eq('id', barbearia.id)
    setSaving(null)
    if (error) showToast('Erro ao guardar. Tenta novamente.')
    else showToast('Guardado ✓')
  }

  const handleSmsAtivoToggle = async (val: boolean) => {
    setSmsAtivo(val)
    await guardar('sms_ativo', val)
  }

  const handleMensagemGuardar = async () => {
    await guardar('sms_mensagem_personalizada', smsMensagem.trim() || null)
  }

  const handleMensagemReset = () => {
    setSmsMensagem(SMS_TEMPLATE_PADRAO)
  }

  const handleMarcacoesOnlineToggle = async (val: boolean) => {
    if (!barbearia) return
    setMarcacoesOnline(val)
    let slug = barbearia.slug
    if (val && !slug) {
      slug = barbearia.nome.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 30)
    }
    setSaving('marcacoes_online')
    await supabase.from('barbearias').update({ marcacoes_online: val, slug }).eq('id', barbearia.id)
    setBarbearia(b => b ? { ...b, marcacoes_online: val, slug: slug! } : b)
    setSaving(null)
    showToast('Guardado ✓')
  }

  const handleEnviarSmsTeste = async () => {
    if (!testeNumero.trim()) return
    setEnviandoTeste(true)
    try {
      const res = await fetch('/api/sms/teste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: testeNumero.trim(),
          mensagem: smsMensagem
            .replace('[nome_cliente]', 'Cliente Teste')
            .replace('[nome_barbearia]', barbearia?.nome || 'Barbearia')
            .replace('[data]', 'segunda-feira, 14 de abril')
            .replace('[hora]', '10:00')
            .replace('[nome_servico]', 'Corte de Cabelo'),
        }),
      })
      const data = await res.json()
      if (data.sucesso) showToast(`SMS enviado para ${testeNumero} ✓`)
      else showToast(`Erro: ${data.erro}`)
    } catch {
      showToast('Erro ao enviar SMS de teste')
    } finally {
      setEnviandoTeste(false)
    }
  }

  // Preview da mensagem com variáveis substituídas
  const previewMensagem = smsMensagem
    .replace('[nome_cliente]', 'João Silva')
    .replace('[nome_barbearia]', barbearia?.nome || 'Barbearia Exemplo')
    .replace('[data]', 'segunda-feira, 14 de abril')
    .replace('[hora]', '10:00')
    .replace('[nome_servico]', 'Corte de Cabelo')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="animate-pulse h-48 bg-gray-200 rounded-2xl" />
        <div className="animate-pulse h-64 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0e4324]">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gere as preferências da tua barbearia</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#0e4324] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* SMS Section */}
      <Section title="Notificações SMS" description="Lembretes automáticos para os teus clientes">

        {/* Toggle global */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Ativar lembretes SMS</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Envia SMS automáticos 24h antes de cada marcação
            </p>
          </div>
          <Toggle
            value={smsAtivo}
            onChange={handleSmsAtivoToggle}
            disabled={saving === 'sms_ativo'}
          />
        </div>

        {smsAtivo && (
          <>
            {/* Mensagem personalizada */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-800">Mensagem personalizada</p>
                <button
                  onClick={handleMensagemReset}
                  className="text-xs text-gray-400 hover:text-[#977c30] transition-colors"
                >
                  Repor padrão
                </button>
              </div>

              {/* Variáveis disponíveis */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {VARIAVEIS.map(v => (
                  <button
                    key={v}
                    onClick={() => setSmsMensagem(prev => prev + v)}
                    className="text-[10px] bg-gray-100 hover:bg-[#0e4324]/10 text-gray-600 hover:text-[#0e4324] px-2 py-0.5 rounded font-mono transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>

              <textarea
                value={smsMensagem}
                onChange={e => setSmsMensagem(e.target.value)}
                rows={3}
                maxLength={320}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] resize-none transition-colors"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-400">{smsMensagem.length}/320 caracteres</p>
                <button
                  onClick={handleMensagemGuardar}
                  disabled={saving === 'sms_mensagem_personalizada'}
                  className="text-xs bg-[#0e4324] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#0a3019] disabled:opacity-50 transition-colors"
                >
                  {saving === 'sms_mensagem_personalizada' ? 'A guardar...' : 'Guardar mensagem'}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium mb-2">PREVIEW DA MENSAGEM</p>
              <div className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-xs text-gray-700 leading-relaxed">{previewMensagem}</p>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                As variáveis serão substituídas pelos dados reais de cada marcação
              </p>
            </div>

            {/* SMS de teste */}
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">Enviar SMS de teste</p>
              <p className="text-xs text-gray-400 mb-3">
                Valida que o Twilio está configurado corretamente
              </p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={testeNumero}
                  onChange={e => setTesteNumero(e.target.value)}
                  placeholder="+351 912 345 678"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
                />
                <button
                  onClick={handleEnviarSmsTeste}
                  disabled={!testeNumero.trim() || enviandoTeste}
                  className="bg-[#977c30] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#7a6327] disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  {enviandoTeste ? 'A enviar...' : '📱 Enviar teste'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Só funciona em modo de desenvolvimento
              </p>
            </div>
          </>
        )}
      </Section>

      {/* Marcações online */}
      <Section title="Marcações online" description="Permite que os clientes agendem pelo link público">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Permitir marcações online</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Os clientes podem agendar sem precisar de ligar
            </p>
          </div>
          <Toggle
            value={marcacoesOnline}
            onChange={handleMarcacoesOnlineToggle}
            disabled={saving === 'marcacoes_online'}
          />
        </div>

        {marcacoesOnline && barbearia?.slug && (
          <div className="bg-[#f0f7f3] rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-2">LINK PÚBLICO</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-[#0e4324] font-mono flex-1 truncate">
                fatura.pt/agendar/{barbearia.slug}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://fatura.pt/agendar/${barbearia.slug}`)
                  showToast('Link copiado ✓')
                }}
                className="text-xs bg-[#0e4324] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#0a3019] transition-colors whitespace-nowrap"
              >
                Copiar
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Info cron */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex gap-3">
          <span className="text-lg">⏰</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Agendamento automático de SMS</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Um cron job corre todos os dias às 10:00 e envia SMS para todas as marcações do dia seguinte que ainda não receberam lembrete. Configurado em <code className="font-mono bg-amber-100 px-1 rounded">vercel.json</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
