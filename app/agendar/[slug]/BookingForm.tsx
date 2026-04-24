'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Servico {
  id: string
  nome: string
  preco: number
  tempo_minutos: number
}

interface Props {
  slug: string
  barbeariaId: string
  horaAbertura: string
  horaFecho: string
  servicos: Servico[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

function gerarSlots(horaAbertura: string, horaFecho: string): string[] {
  const slots: string[] = []
  const [hA, mA] = horaAbertura.split(':').map(Number)
  const [hF, mF] = horaFecho.split(':').map(Number)
  let h = hA, m = mA
  while (h < hF || (h === hF && m < mF)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += 30
    if (m >= 60) { h++; m -= 60 }
  }
  return slots
}

function formatDatePt(d: Date) {
  return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function BookingForm({ slug, barbeariaId, horaAbertura, horaFecho, servicos }: Props) {
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null)
  const [dataSelecionada, setDataSelecionada] = useState<string>('')
  const [horaSelecionada, setHoraSelecionada] = useState<string>('')
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([])
  const [horasBloqueadas, setHorasBloqueadas] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [nome, setNome] = useState('')
  const [telemovel, setTelemovel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  // Gerar datas disponíveis (próximos 14 dias, excluindo domingo)
  const datasDisponiveis = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d
  }).filter(d => d.getDay() !== 0) // excluir domingos

  const slots = gerarSlots(horaAbertura, horaFecho)

  // Buscar horas ocupadas e bloqueadas quando data muda
  useEffect(() => {
    if (!dataSelecionada || !barbeariaId) return
    const fetchDisponibilidade = async () => {
      setLoadingSlots(true)

      const [{ data: marcacoesData }, { data: bloqueiosData }] = await Promise.all([
        supabase
          .from('marcacoes')
          .select('data_hora, servicos(tempo_minutos)')
          .eq('barbearia_id', barbeariaId)
          .neq('estado', 'desistencia')
          .gte('data_hora', `${dataSelecionada}T00:00:00`)
          .lte('data_hora', `${dataSelecionada}T23:59:59`),
        supabase
          .from('bloqueios')
          .select('hora_inicio, hora_fim')
          .eq('barbearia_id', barbeariaId)
          .eq('data', dataSelecionada),
      ])

      // Slots ocupados por marcações existentes
      const ocupadas = new Set<string>()
      for (const m of marcacoesData ?? []) {
        const inicio = new Date(m.data_hora)
        const duracao = (m.servicos as unknown as { tempo_minutos: number } | null)?.tempo_minutos ?? 30
        for (let i = 0; i < duracao; i += 30) {
          const slot = new Date(inicio.getTime() + i * 60000)
          ocupadas.add(`${String(slot.getHours()).padStart(2, '0')}:${String(slot.getMinutes()).padStart(2, '0')}`)
        }
      }
      setHorasOcupadas(Array.from(ocupadas))

      // Slots bloqueados por bloqueios de horário
      const bloqueadas = new Set<string>()
      for (const b of bloqueiosData ?? []) {
        const [hI, mI] = b.hora_inicio.slice(0, 5).split(':').map(Number)
        const [hF, mF] = b.hora_fim.slice(0, 5).split(':').map(Number)
        let h = hI, m = mI
        while (h < hF || (h === hF && m < mF)) {
          bloqueadas.add(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
          m += 30
          if (m >= 60) { h++; m -= 60 }
        }
      }
      setHorasBloqueadas(Array.from(bloqueadas))

      setLoadingSlots(false)
    }
    fetchDisponibilidade()
  }, [dataSelecionada, barbeariaId, supabase])

  const handleSubmit = async () => {
    if (!nome.trim()) { setErro('Introduz o teu nome.'); return }
    if (!telemovel.trim()) { setErro('Introduz o teu telemóvel.'); return }
    if (!servicoSelecionado || !dataSelecionada || !horaSelecionada) { setErro('Preenche todos os campos.'); return }

    setErro('')
    setSubmitting(true)

    const dataHora = `${dataSelecionada}T${horaSelecionada}:00`

    const res = await fetch('/api/agendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        servico_id: servicoSelecionado.id,
        data_hora: dataHora,
        cliente_nome: nome,
        cliente_telemovel: telemovel,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok || !data.sucesso) {
      setErro(data.erro ?? 'Erro ao marcar. Tenta novamente.')
      return
    }

    setSucesso(true)
  }

  if (sucesso) {
    const dataObj = new Date(`${dataSelecionada}T${horaSelecionada}:00`)
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm" style={{ border: '0.5px solid rgba(0,0,0,0.08)' }}>
        <div className="w-16 h-16 bg-verde/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-verde" style={{ fontSize: '32px' }}>check_circle</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-verde mb-2">Marcação confirmada!</h2>
        <p className="text-gray-600 mb-4">
          A tua marcação foi registada com sucesso.
        </p>
        <div className="bg-verde/5 rounded-xl p-4 text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Serviço</span>
            <span className="font-medium text-gray-800">{servicoSelecionado?.nome}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Data</span>
            <span className="font-medium text-gray-800 capitalize">{formatDatePt(dataObj)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Hora</span>
            <span className="font-medium text-gray-800">{horaSelecionada}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Nome</span>
            <span className="font-medium text-gray-800">{nome}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">Aguarda a confirmação.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as const).map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step >= s ? 'bg-verde text-white' : 'bg-gray-200 text-gray-400'
            }`}>{s}</div>
            <div className={`text-xs font-medium transition-colors ${step >= s ? 'text-verde' : 'text-gray-400'}`}>
              {s === 1 ? 'Serviço' : s === 2 ? 'Data & Hora' : 'Os teus dados'}
            </div>
            {s < 3 && <div className={`flex-1 h-px ${step > s ? 'bg-verde' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Serviço */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <h2 className="font-serif font-semibold text-lg text-gray-900 mb-4">Escolhe o serviço</h2>
          {servicos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhum serviço disponível.</p>
          ) : (
            <div className="space-y-2">
              {servicos.map(s => {
                const active = servicoSelecionado?.id === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setServicoSelecionado(active ? null : s)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-left ${
                      active
                        ? 'bg-verde text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{s.nome}</p>
                      <p className={`text-sm mt-0.5 ${active ? 'text-white/70' : 'text-gray-500'}`}>{s.tempo_minutos} min</p>
                    </div>
                    <p className={`font-serif font-semibold text-lg ${active ? 'text-white' : 'text-verde'}`}>{fmt(s.preco)}</p>
                  </button>
                )
              })}
            </div>
          )}
          <button
            onClick={() => setStep(2)}
            disabled={!servicoSelecionado}
            className="btn-primary w-full mt-6 py-3 disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Step 2: Data e Hora */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <h2 className="font-serif font-semibold text-lg text-gray-900 mb-4">Escolhe a data e hora</h2>

          {/* Datas */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Data</p>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
              {datasDisponiveis.map(d => {
                const iso = d.toISOString().split('T')[0]
                const active = dataSelecionada === iso
                return (
                  <button
                    key={iso}
                    onClick={() => { setDataSelecionada(iso); setHoraSelecionada('') }}
                    className={`flex flex-col items-center px-1 py-2 rounded-xl transition-all text-sm ${
                      active ? 'bg-verde text-white' : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`text-xs font-medium uppercase ${active ? 'text-white/70' : 'text-gray-400'}`}>
                      {d.toLocaleDateString('pt-PT', { weekday: 'short' })}
                    </span>
                    <span className="font-bold">{d.getDate()}</span>
                    <span className={`text-xs ${active ? 'text-white/70' : 'text-gray-400'}`}>
                      {d.toLocaleDateString('pt-PT', { month: 'short' })}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Horas */}
          {dataSelecionada && (
            <div className="mt-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Hora</p>
              {loadingSlots ? (
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-10 animate-pulse bg-gray-100 rounded-lg" />)}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(slot => {
                    // Verifica se o slot OU qualquer intervalo dentro da duração do novo serviço está ocupado
                    const durNovoMin = servicoSelecionado?.tempo_minutos ?? 30
                    const [slotH, slotM] = slot.split(':').map(Number)
                    const slotTotalMin = slotH * 60 + slotM
                    const ocupado = Array.from({ length: Math.ceil(durNovoMin / 30) }, (_, i) => {
                      const total = slotTotalMin + i * 30
                      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
                    }).some(s => horasOcupadas.includes(s))
                    const bloqueado = horasBloqueadas.includes(slot)
                    const indisponivel = ocupado || bloqueado
                    const active = horaSelecionada === slot
                    return (
                      <button
                        key={slot}
                        onClick={() => !indisponivel && setHoraSelecionada(slot)}
                        disabled={indisponivel}
                        title={bloqueado ? 'Horário indisponível' : ocupado ? 'Já reservado' : undefined}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          bloqueado ? 'bg-orange-50 text-orange-300 cursor-not-allowed' :
                          ocupado   ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through' :
                          active    ? 'bg-verde text-white' :
                          'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!dataSelecionada || !horaSelecionada}
              className="btn-primary flex-1 py-3 disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Dados pessoais */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <h2 className="font-serif font-semibold text-lg text-gray-900 mb-1">Os teus dados</h2>
          <p className="text-sm text-gray-400 mb-5">Para confirmar a tua marcação.</p>

          {/* Resumo */}
          <div className="bg-verde/5 rounded-xl p-4 mb-5 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Serviço</span>
              <span className="font-medium text-gray-800">{servicoSelecionado?.nome} · {fmt(servicoSelecionado?.preco ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Data</span>
              <span className="font-medium text-gray-800 capitalize">
                {dataSelecionada && formatDatePt(new Date(dataSelecionada + 'T12:00:00'))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Hora</span>
              <span className="font-medium text-gray-800">{horaSelecionada}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="O teu nome"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telemóvel *</label>
              <input
                type="tel"
                value={telemovel}
                onChange={e => setTelemovel(e.target.value)}
                placeholder="+351 912 345 678"
                className="input-field"
              />
            </div>
          </div>

          {erro && (
            <div className="mt-3 flex items-center gap-2 text-red-700 text-xs bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
              {erro}
            </div>
          )}

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex-1 py-3 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  A confirmar...
                </>
              ) : 'Confirmar marcação'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
