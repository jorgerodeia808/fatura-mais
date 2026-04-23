'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getNichoConfig } from '@/lib/nicho'

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
  'Analisa a minha situação financeira atual',
  'Como posso aumentar a minha receita este mês?',
  'Que serviços devo promover mais?',
  'Onde posso cortar despesas sem perder qualidade?',
  'Como melhorar a taxa de marcações confirmadas?',
  'Dá-me um plano de ação para esta semana',
]

function HealthRing({ score }: { score: number }) {
  const raio = 28
  const circunferencia = 2 * Math.PI * raio
  const progresso = (score / 100) * circunferencia
  const cor = score >= 70 ? 'rgb(var(--verde))' : score >= 40 ? 'rgb(var(--dourado))' : '#dc2626'

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={raio} fill="none" stroke="#f0eee8" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={raio} fill="none"
          stroke={cor} strokeWidth="5"
          strokeDasharray={`${progresso} ${circunferencia}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <span className="absolute text-xs font-bold font-serif" style={{ color: cor }}>{score}</span>
    </div>
  )
}

function BolhaMensagem({ msg }: { msg: Mensagem }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-verde flex items-center justify-center flex-shrink-0 mt-1">
          <span className="material-symbols-outlined text-white" style={{fontSize:'16px'}}>psychology</span>
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-verde text-white rounded-2xl rounded-tr-sm'
          : 'bg-white border border-black/5 shadow-sm text-ink rounded-2xl rounded-tl-sm'
      }`}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className={`text-xs mt-1.5 ${isUser ? 'text-white/50' : 'text-ink-secondary'}`}>
          {msg.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-dourado flex items-center justify-center flex-shrink-0 mt-1">
          <span className="material-symbols-outlined text-white" style={{fontSize:'16px'}}>person</span>
        </div>
      )}
    </div>
  )
}

function IndicadorDigitacao() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-xl bg-verde flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-white" style={{fontSize:'16px'}}>psychology</span>
      </div>
      <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-black/5 shadow-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-ink-secondary animate-bounce" style={{animationDelay:'0ms'}}></span>
          <span className="w-2 h-2 rounded-full bg-ink-secondary animate-bounce" style={{animationDelay:'150ms'}}></span>
          <span className="w-2 h-2 rounded-full bg-ink-secondary animate-bounce" style={{animationDelay:'300ms'}}></span>
        </div>
      </div>
    </div>
  )
}

export default function ConselheiroIAPage() {
  const nicho = getNichoConfig()
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
        supabase.from('faturacao').select('valor, gorjeta').eq('barbearia_id', barbearia.id).gte('data_hora', primeiroDiaMes).lte('data_hora', ultimoDiaMes),
        supabase.from('despesas').select('valor').eq('barbearia_id', barbearia.id).gte('data', primeiroDiaMes).lte('data', ultimoDiaMes),
        supabase.from('marcacoes').select('id').eq('barbearia_id', barbearia.id).gte('data_hora', hoje),
        supabase.from('custos_fixos').select('valor').eq('barbearia_id', barbearia.id),
      ])

      const receitaMes = faturacao?.reduce((s, f) => s + (f.valor || 0) + (f.gorjeta || 0), 0) || 0
      const despesasMes = despesas?.reduce((s, d) => s + (d.valor || 0), 0) || 0
      const lucroLiquido = receitaMes - despesasMes
      const margemLucro = receitaMes > 0 ? parseFloat((lucroLiquido / receitaMes * 100).toFixed(1)) : 0
      const breakEven = custosFixos?.reduce((s, c) => s + (c.valor || 0), 0) || 0

      const scores = []
      if (receitaMes > 0 && breakEven > 0) scores.push(Math.min(100, (receitaMes / breakEven) * 100))
      if (margemLucro > 0) scores.push(Math.min(100, margemLucro * 2))
      const healthScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50

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
          content: `Atingiste o limite diário de 20 mensagens. Volta amanhã para continuar a conversa!`,
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
    await enviarMensagem(`Faz uma análise completa do meu ${nicho.nomeNegocio} com base nos dados atuais e dá-me as tuas principais recomendações.`)
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
      <div className="rounded-2xl p-6 mb-5" style={{background:'linear-gradient(135deg, rgb(var(--verde)) 0%, rgb(var(--verde-claro)) 100%)'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{fontSize:'22px'}}>psychology</span>
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl text-white">Conselheiro IA</h1>
              <p className="text-white/60 text-xs">
                {carregandoMetricas ? 'A carregar dados...' : `Especialista em ${metricas?.nome || nicho.nomeNegocio}`}
              </p>
            </div>
          </div>
          {!carregandoMetricas && metricas && (
            <div className="text-right hidden sm:block">
              <p className="text-white/50 text-xs">Mensagens hoje</p>
              <p className="text-white font-bold font-serif text-lg">{metricas.restantesMensagens} <span className="text-white/60 text-xs font-sans font-normal">restantes</span></p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">

        {/* Main: chat */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-black/5 overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5">
            {mensagens.length === 0 && !carregando && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-[#f0eee8] flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-verde" style={{fontSize:'32px'}}>forum</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-ink mb-1">Como posso ajudar?</h3>
                <p className="text-ink-secondary text-sm mb-6 max-w-sm mx-auto">
                  Analiso os teus dados em tempo real e dou conselhos personalizados para o teu negócio.
                </p>

                {!analiseInicial && !carregandoMetricas && (
                  <button
                    onClick={iniciarAnalise}
                    className="btn-primary mx-auto mb-6 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined" style={{fontSize:'18px'}}>search</span>
                    Analisar o meu {nicho.nomeNegocio} agora
                  </button>
                )}

                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                  {SUGESTOES_RAPIDAS.map(s => (
                    <button
                      key={s}
                      onClick={() => enviarMensagem(s)}
                      disabled={carregando || limiteAtingido}
                      className="text-xs font-medium px-3 py-2 rounded-full bg-[#f0eee8] text-ink-secondary hover:bg-verde hover:text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {s}
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
                <div className="w-8 h-8 rounded-xl bg-verde flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="material-symbols-outlined text-white" style={{fontSize:'16px'}}>psychology</span>
                </div>
                <div className="max-w-[80%] bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-black/5 shadow-sm">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">{streamingText}</p>
                  <span className="inline-block w-0.5 h-4 bg-verde ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions (when chat has history) */}
          {mensagens.length > 0 && !carregando && !limiteAtingido && (
            <div className="px-5 pb-2 flex gap-2 overflow-x-auto">
              {SUGESTOES_RAPIDAS.slice(0, 3).map(s => (
                <button
                  key={s}
                  onClick={() => enviarMensagem(s)}
                  className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full bg-[#f0eee8] text-ink-secondary hover:bg-verde hover:text-white transition-all duration-150 whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t border-black/5">
            {limiteAtingido ? (
              <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="material-symbols-outlined text-amber-600" style={{fontSize:'18px'}}>warning</span>
                <p className="text-amber-700 text-sm font-medium">Limite diário atingido. Volta amanhã!</p>
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunta sobre o teu negócio..."
                  rows={1}
                  className="flex-1 resize-none input-field"
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
                  className="btn-primary !px-4 !py-2.5 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {carregando ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined" style={{fontSize:'20px'}}>send</span>
                  )}
                </button>
              </div>
            )}
            <p className="text-xs text-ink-secondary mt-1.5 text-center">
              Shift+Enter para nova linha · {metricas?.restantesMensagens ?? '—'} mensagens restantes hoje
            </p>
          </div>
        </div>

        {/* Metrics sidebar */}
        <div className="w-56 flex-shrink-0 hidden lg:flex flex-col gap-3">
          {carregandoMetricas ? (
            <div className="bg-white rounded-2xl border border-black/5 p-4 animate-pulse space-y-3">
              <div className="h-3 bg-[#f0eee8] rounded w-3/4" />
              <div className="h-8 bg-[#f0eee8] rounded" />
              <div className="h-8 bg-[#f0eee8] rounded" />
              <div className="h-8 bg-[#f0eee8] rounded" />
            </div>
          ) : metricas ? (
            <>
              {/* Health score */}
              <div className="card">
                <p className="text-[10px] text-ink-secondary uppercase tracking-widest font-medium mb-3">Saúde do negócio</p>
                <div className="flex items-center gap-3">
                  <HealthRing score={metricas.healthScore} />
                  <div>
                    <p className="text-xs text-ink-secondary">Score</p>
                    <p className={`text-sm font-bold font-serif ${
                      metricas.healthScore >= 70 ? 'text-verde' : metricas.healthScore >= 40 ? 'text-dourado' : 'text-red-600'
                    }`}>
                      {metricas.healthScore >= 70 ? 'Bom' : metricas.healthScore >= 40 ? 'Médio' : 'Crítico'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Monthly metrics */}
              <div className="card space-y-3">
                <p className="text-[10px] text-ink-secondary uppercase tracking-widest font-medium">Métricas do mês</p>
                <div>
                  <p className="text-xs text-ink-secondary">Receita</p>
                  <p className="text-base font-bold font-serif text-verde">
                    €{metricas.receitaMes.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary">Lucro</p>
                  <p className={`text-base font-bold font-serif ${metricas.lucroLiquido >= 0 ? 'text-verde' : 'text-red-600'}`}>
                    €{metricas.lucroLiquido.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary">Margem</p>
                  <p className="text-base font-bold font-serif text-ink">{metricas.margemLucro}%</p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary mb-1.5">Break-even</p>
                  <div className="h-1.5 bg-[#f0eee8] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${metricas.receitaMes >= metricas.breakEven ? 'bg-verde' : 'bg-dourado'}`}
                      style={{ width: `${Math.min(100, metricas.breakEven > 0 ? (metricas.receitaMes / metricas.breakEven) * 100 : 0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink-secondary mt-1">
                    {metricas.breakEven > 0
                      ? metricas.receitaMes >= metricas.breakEven
                        ? 'Atingido'
                        : `Falta €${(metricas.breakEven - metricas.receitaMes).toFixed(0)}`
                      : 'Sem custos fixos'}
                  </p>
                </div>
              </div>

              {/* Today bookings */}
              <div className="card">
                <p className="text-[10px] text-ink-secondary uppercase tracking-widest font-medium mb-2">Marcações hoje</p>
                <p className="text-2xl font-bold font-serif text-verde">{metricas.marcacoesHoje}</p>
                <p className="text-xs text-ink-secondary mt-0.5">agendadas</p>
              </div>

              {/* AI message limit */}
              <div className="card bg-[#f0eee8] border-verde/10">
                <p className="text-[10px] text-verde uppercase tracking-widest font-medium mb-2">Mensagens IA</p>
                <div className="h-1.5 bg-verde/[0.15] rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-verde rounded-full transition-all"
                    style={{ width: `${(metricas.restantesMensagens / 20) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-verde font-medium">{metricas.restantesMensagens}/20 restantes</p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

