'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface MetricasBarbearia {
  nome: string
  receitaMes: number
  despesasMes: number
  lucroLiquido: number
  margemLucro: number
  healthScore: number
  breakEven: number
  marcacoesHoje: number
  restantesMensagens: number
}

const SUGESTOES_RAPIDAS = [
  { emoji: '📊', texto: 'Analisa a minha situação financeira atual' },
  { emoji: '💡', texto: 'Como posso aumentar a minha receita este mês?' },
  { emoji: '✂️', texto: 'Que serviços devo promover mais?' },
  { emoji: '💸', texto: 'Onde posso cortar despesas sem perder qualidade?' },
  { emoji: '📅', texto: 'Como melhorar a taxa de marcações confirmadas?' },
  { emoji: '🎯', texto: 'Dá-me um plano de ação para esta semana' },
]

function HealthRing({ score }: { score: number }) {
  const raio = 28
  const circunferencia = 2 * Math.PI * raio
  const progresso = (score / 100) * circunferencia
  const cor = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={raio} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={raio} fill="none"
          stroke={cor} strokeWidth="5"
          strokeDasharray={`${progresso} ${circunferencia}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color: cor }}>{score}</span>
    </div>
  )
}

function BolhaMensagem({ msg }: { msg: Mensagem }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#0e4324] flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-sm">🤖</span>
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-[#0e4324] text-white rounded-tr-sm'
          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-green-200' : 'text-gray-400'}`}>
          {msg.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[#977c30] flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-sm">👤</span>
        </div>
      )}
    </div>
  )
}

function IndicadorDigitacao() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-[#0e4324] flex items-center justify-center flex-shrink-0">
        <span className="text-sm">🤖</span>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full inline-block"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ConselheiroIAPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [metricas, setMetricas] = useState<MetricasBarbearia | null>(null)
  const [carregandoMetricas, setCarregandoMetricas] = useState(true)
  const [analiseInicial, setAnaliseInicial] = useState(false)
  const [limiteAtingido, setLimiteAtingido] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, streamingText])

  const carregarMetricas = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: barbearia } = await supabase
        .from('barbearias')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!barbearia) return

      const mesAtual = new Date()
      const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).toISOString()
      const ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).toISOString()
      const hoje = new Date().toISOString().split('T')[0]

      const [
        { data: faturacao },
        { data: despesas },
        { data: marcacoesHoje },
        { data: custosFixos },
      ] = await Promise.all([
        supabase.from('faturacao').select('valor_total').eq('barbearia_id', barbearia.id).gte('data', primeiroDiaMes).lte('data', ultimoDiaMes),
        supabase.from('despesas').select('valor').eq('barbearia_id', barbearia.id).gte('data', primeiroDiaMes).lte('data', ultimoDiaMes),
        supabase.from('marcacoes').select('id').eq('barbearia_id', barbearia.id).gte('data_hora', hoje),
        supabase.from('custos_fixos').select('valor').eq('barbearia_id', barbearia.id),
      ])

      const receitaMes = faturacao?.reduce((s, f) => s + (f.valor_total || 0), 0) || 0
      const despesasMes = despesas?.reduce((s, d) => s + (d.valor || 0), 0) || 0
      const lucroLiquido = receitaMes - despesasMes
      const margemLucro = receitaMes > 0 ? parseFloat((lucroLiquido / receitaMes * 100).toFixed(1)) : 0
      const breakEven = custosFixos?.reduce((s, c) => s + (c.valor || 0), 0) || 0

      const scores = []
      if (receitaMes > 0 && breakEven > 0) scores.push(Math.min(100, (receitaMes / breakEven) * 100))
      if (margemLucro > 0) scores.push(Math.min(100, margemLucro * 2))
      const healthScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50

      // Rate limit info
      const limitResponse = await fetch('/api/conselheiro')
      const limitData = await limitResponse.json()

      setMetricas({
        nome: barbearia.nome,
        receitaMes,
        despesasMes,
        lucroLiquido,
        margemLucro,
        healthScore,
        breakEven,
        marcacoesHoje: marcacoesHoje?.length || 0,
        restantesMensagens: limitData.restantes || 20,
      })

      if (limitData.restantes <= 0) setLimiteAtingido(true)
    } catch (err) {
      console.error('Erro ao carregar métricas:', err)
    } finally {
      setCarregandoMetricas(false)
    }
  }, [supabase])

  useEffect(() => {
    carregarMetricas()
  }, [carregarMetricas])

  const enviarMensagem = async (texto: string) => {
    if (!texto.trim() || carregando || limiteAtingido) return

    const novaMensagemUser: Mensagem = {
      role: 'user',
      content: texto.trim(),
      timestamp: new Date(),
    }

    setMensagens(prev => [...prev, novaMensagemUser])
    setInput('')
    setCarregando(true)
    setStreamingText('')

    const historicoParaEnviar = mensagens.map(m => ({ role: m.role, content: m.content }))

    try {
      const response = await fetch('/api/conselheiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: texto.trim(),
          historico: historicoParaEnviar,
        }),
      })

      if (response.status === 429) {
        setLimiteAtingido(true)
        setMensagens(prev => [...prev, {
          role: 'assistant',
          content: `Atingiste o limite diário de ${metricas?.restantesMensagens === 0 ? '20' : '20'} mensagens. Volta amanhã para continuar a conversa! 🌅`,
          timestamp: new Date(),
        }])
        setCarregando(false)
        return
      }

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erro desconhecido')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let respostaCompleta = ''

      if (reader) {
        let streamDone = false
        while (!streamDone) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const linhas = chunk.split('\n')

          for (const linha of linhas) {
            if (!linha.startsWith('data: ')) continue
            const dados = linha.slice(6).trim()
            if (dados === '[DONE]') { streamDone = true; break }
            if (!dados) continue
            try {
              const json = JSON.parse(dados)
              if (json.error) throw new Error(json.error)
              if (json.text) {
                respostaCompleta += json.text
                setStreamingText(respostaCompleta)
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
                throw parseErr
              }
            }
          }
        }
      }

      setStreamingText('')
      setMensagens(prev => [...prev, {
        role: 'assistant',
        content: respostaCompleta || 'Desculpa, não consegui gerar uma resposta.',
        timestamp: new Date(),
      }])

      // Atualizar contador de mensagens restantes
      setMetricas(prev => prev ? { ...prev, restantesMensagens: Math.max(0, prev.restantesMensagens - 1) } : prev)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setStreamingText('')
      setMensagens(prev => [...prev, {
        role: 'assistant',
        content: `Ocorreu um erro: ${errorMessage}. Tenta novamente.`,
        timestamp: new Date(),
      }])
    } finally {
      setCarregando(false)
      inputRef.current?.focus()
    }
  }

  const iniciarAnalise = async () => {
    if (analiseInicial) return
    setAnaliseInicial(true)
    await enviarMensagem('Faz uma análise completa da minha barbearia com base nos dados atuais e dá-me as tuas principais recomendações.')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensagem(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[900px]">
      {/* Header */}
      <div className="bg-[#0e4324] rounded-2xl p-5 mb-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#977c30] flex items-center justify-center text-2xl">
            🤖
          </div>
          <div>
            <h1 className="text-xl font-bold">Conselheiro IA</h1>
            <p className="text-green-200 text-sm">
              {carregandoMetricas ? 'A carregar dados...' : `Especialista em ${metricas?.nome || 'Barbearia'}`}
            </p>
          </div>
        </div>
        {!carregandoMetricas && metricas && (
          <div className="text-right hidden sm:block">
            <p className="text-green-200 text-xs">Mensagens hoje</p>
            <p className="text-white font-bold">{metricas.restantesMensagens} restantes</p>
          </div>
        )}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Coluna principal: chat */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4">
            {mensagens.length === 0 && !carregando && (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">💬</div>
                <h3 className="text-lg font-semibold text-[#0e4324] mb-1">Como posso ajudar?</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  Analiso os teus dados em tempo real e dou conselhos personalizados para o teu negócio.
                </p>

                {!analiseInicial && !carregandoMetricas && (
                  <button
                    onClick={iniciarAnalise}
                    className="bg-[#0e4324] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0a3019] transition-colors mb-6 text-sm"
                  >
                    🔍 Analisar a minha barbearia agora
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                  {SUGESTOES_RAPIDAS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => enviarMensagem(s.texto)}
                      disabled={carregando || limiteAtingido}
                      className="text-left px-4 py-2.5 rounded-xl border border-gray-200 hover:border-[#0e4324] hover:bg-[#0e4324]/5 transition-all text-sm text-gray-700 disabled:opacity-40"
                    >
                      <span className="mr-2">{s.emoji}</span>{s.texto}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensagens.map((msg, i) => (
              <BolhaMensagem key={i} msg={msg} />
            ))}

            {carregando && streamingText === '' && <IndicadorDigitacao />}

            {streamingText && (
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#0e4324] flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">🤖</span>
                </div>
                <div className="max-w-[80%] bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">{streamingText}</p>
                  <span className="inline-block w-1 h-4 bg-[#0e4324] ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões rápidas (quando há histórico) */}
          {mensagens.length > 0 && !carregando && !limiteAtingido && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {SUGESTOES_RAPIDAS.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => enviarMensagem(s.texto)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#977c30] hover:text-[#977c30] transition-colors text-gray-600 whitespace-nowrap"
                >
                  {s.emoji} {s.texto}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            {limiteAtingido ? (
              <div className="text-center py-3 bg-amber-50 rounded-xl text-amber-700 text-sm font-medium border border-amber-200">
                ⚠️ Limite diário atingido. Volta amanhã!
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreve a tua pergunta... (Enter para enviar)"
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0e4324] focus:ring-1 focus:ring-[#0e4324]/20 transition-colors"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                  }}
                  disabled={carregando}
                />
                <button
                  onClick={() => enviarMensagem(input)}
                  disabled={!input.trim() || carregando}
                  className="w-11 h-11 bg-[#0e4324] text-white rounded-xl flex items-center justify-center hover:bg-[#0a3019] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  {carregando ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              Shift+Enter para nova linha · {metricas?.restantesMensagens ?? '—'} mensagens restantes hoje
            </p>
          </div>
        </div>

        {/* Sidebar de métricas */}
        <div className="w-56 flex-shrink-0 hidden lg:flex flex-col gap-3">
          {carregandoMetricas ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-8 bg-gray-200 rounded mb-2" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          ) : metricas ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs text-gray-500 font-medium mb-3">SAÚDE DO NEGÓCIO</p>
                <div className="flex items-center gap-3">
                  <HealthRing score={metricas.healthScore} />
                  <div>
                    <p className="text-xs text-gray-500">Score</p>
                    <p className={`text-sm font-bold ${metricas.healthScore >= 70 ? 'text-green-600' : metricas.healthScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {metricas.healthScore >= 70 ? 'Bom' : metricas.healthScore >= 40 ? 'Médio' : 'Crítico'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <p className="text-xs text-gray-500 font-medium">MÉTRICAS DO MÊS</p>
                <div>
                  <p className="text-xs text-gray-400">Receita</p>
                  <p className="text-base font-bold text-[#0e4324]">€{metricas.receitaMes.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Lucro</p>
                  <p className={`text-base font-bold ${metricas.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{metricas.lucroLiquido.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Margem</p>
                  <p className="text-base font-bold text-gray-700">{metricas.margemLucro}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Break-even</p>
                  <div className="mt-1">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${metricas.receitaMes >= metricas.breakEven ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, metricas.breakEven > 0 ? (metricas.receitaMes / metricas.breakEven) * 100 : 0)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {metricas.breakEven > 0
                        ? metricas.receitaMes >= metricas.breakEven
                          ? '✅ Atingido'
                          : `Falta €${(metricas.breakEven - metricas.receitaMes).toFixed(0)}`
                        : 'Sem custos fixos'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs text-gray-500 font-medium mb-3">MARCAÇÕES HOJE</p>
                <p className="text-2xl font-bold text-[#0e4324]">{metricas.marcacoesHoje}</p>
                <p className="text-xs text-gray-400">marcações agendadas</p>
              </div>

              <div className="bg-[#0e4324]/5 rounded-2xl border border-[#0e4324]/10 p-4">
                <p className="text-xs text-[#0e4324] font-medium mb-1">MENSAGENS IA</p>
                <div className="h-1.5 bg-[#0e4324]/20 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-[#0e4324] rounded-full transition-all"
                    style={{ width: `${(metricas.restantesMensagens / 20) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[#0e4324]">{metricas.restantesMensagens}/20 restantes</p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
