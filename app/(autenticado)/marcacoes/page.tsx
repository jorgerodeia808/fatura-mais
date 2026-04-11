'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────
interface Marcacao {
  id: string
  cliente_nome: string
  cliente_telemovel: string | null
  servico_id: string | null
  data_hora: string
  estado: 'pendente' | 'confirmado' | 'desistencia'
  sms_enviado: boolean
  servicos: { nome: string; preco: number; tempo_minutos: number } | null
}

interface Servico {
  id: string
  nome: string
  preco: number
  tempo_minutos: number
}

interface Barbearia {
  id: string
  nome: string
  hora_abertura: string
  hora_fecho: string
  marcacoes_online?: boolean
  slug?: string | null
}

// ── Constants ──────────────────────────────────────────────────────
const HOURS = Array.from({ length: 11 }, (_, i) => i + 9) // 9..19
const PX_PER_HOUR = 64
const CALENDAR_START = 9

const TIME_OPTIONS: string[] = []
for (let h = 9; h <= 18; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const STATUS = {
  confirmado: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', pill: 'bg-green-100 text-green-700', label: 'Confirmado' },
  pendente: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', pill: 'bg-yellow-100 text-yellow-700', label: 'Pendente' },
  desistencia: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', pill: 'bg-red-100 text-red-700', label: 'Desistência' },
}

// ── Helpers ────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

function toDateStr(d: Date) { return d.toISOString().split('T')[0] }

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

function generateSlug(nome: string): string {
  return nome.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 30)
}

// ── Calendar Block ─────────────────────────────────────────────────
function CalendarBlock({ m, onClick }: { m: Marcacao; onClick: () => void }) {
  const dt = new Date(m.data_hora)
  const startMin = (dt.getHours() - CALENDAR_START) * 60 + dt.getMinutes()
  const dur = (m.servicos?.tempo_minutos ?? 30)
  const top = (startMin / 60) * PX_PER_HOUR
  const height = Math.max((dur / 60) * PX_PER_HOUR, 24)
  const s = STATUS[m.estado]

  return (
    <div
      onClick={onClick}
      className={`absolute left-0.5 right-0.5 rounded-md border px-1 py-0.5 cursor-pointer hover:brightness-95 transition-all overflow-hidden ${s.bg} ${s.border}`}
      style={{ top, height }}
    >
      <p className={`text-[10px] font-semibold leading-tight truncate ${s.text}`}>{m.cliente_nome}</p>
      {height >= 36 && (
        <p className={`text-[9px] leading-tight truncate ${s.text} opacity-75`}>
          {m.servicos?.nome ?? '—'}
        </p>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function MarcacoesPage() {
  const supabase = createClient()
  const subRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [marcacoes, setMarcacoes] = useState<Marcacao[]>([])
  const [smsMes, setSmsMes] = useState(0)
  const [loadingInit, setLoadingInit] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [formError, setFormError] = useState('')

  // Calendar
  const [weekStart, setWeekStart] = useState(getMonday(today))
  const [selectedDay, setSelectedDay] = useState(new Date(today))

  // Form
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTel, setClienteTel] = useState('')
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [dataForm, setDataForm] = useState(toDateStr(today))
  const [horaForm, setHoraForm] = useState('09:00')
  const [smsToggle, setSmsToggle] = useState(true)

  // Online bookings
  const [marcacoesOnline, setMarcacoesOnline] = useState(false)
  const [savingOnline, setSavingOnline] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)

  // ── Fetch marcações da semana ───────────────────────────────────
  const fetchMarcacoes = useCallback(async (bid: string, ws: Date) => {
    const start = toDateStr(ws)
    const end = toDateStr(addDays(ws, 7))
    const { data } = await supabase
      .from('marcacoes')
      .select('id, cliente_nome, cliente_telemovel, servico_id, data_hora, estado, sms_enviado, servicos(nome, preco, tempo_minutos)')
      .eq('barbearia_id', bid)
      .gte('data_hora', `${start}T00:00:00`)
      .lt('data_hora', `${end}T00:00:00`)
      .order('data_hora')
    setMarcacoes((data as unknown as Marcacao[]) ?? [])
  }, [supabase])

  // ── Fetch SMS count do mês ─────────────────────────────────────
  const fetchSmsMes = useCallback(async (bid: string) => {
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const { count } = await supabase
      .from('marcacoes')
      .select('id', { count: 'exact', head: true })
      .eq('barbearia_id', bid)
      .eq('sms_enviado', true)
      .gte('data_hora', start)
      .lte('data_hora', end)
    setSmsMes(count ?? 0)
  }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init ──────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: barb } = await supabase
        .from('barbearias').select('*').eq('user_id', user.id).single()
      if (!barb) { setLoadingInit(false); return }
      setBarbearia(barb as Barbearia)
      setMarcacoesOnline(barb.marcacoes_online ?? false)
      const { data: servs } = await supabase
        .from('servicos').select('id, nome, preco, tempo_minutos')
        .eq('barbearia_id', barb.id).eq('ativo', true).order('nome')
      setServicos((servs as Servico[]) ?? [])
      await fetchMarcacoes(barb.id, weekStart)
      await fetchSmsMes(barb.id)
      setLoadingInit(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime ──────────────────────────────────────────────────
  useEffect(() => {
    if (!barbearia) return
    if (subRef.current) supabase.removeChannel(subRef.current)
    const ch = supabase
      .channel(`marcacoes-${barbearia.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'marcacoes',
        filter: `barbearia_id=eq.${barbearia.id}`,
      }, () => {
        fetchMarcacoes(barbearia.id, weekStart)
        fetchSmsMes(barbearia.id)
      })
      .subscribe()
    subRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [barbearia, weekStart, supabase, fetchMarcacoes, fetchSmsMes])

  // ── Week navigation ───────────────────────────────────────────
  const changeWeek = (delta: number) => {
    const ws = addDays(weekStart, delta * 7)
    setWeekStart(ws)
    if (barbearia) fetchMarcacoes(barbearia.id, ws)
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // ── Metrics (today) ───────────────────────────────────────────
  const todayStr = toDateStr(today)
  const marcacoesHoje = marcacoes.filter(m => m.data_hora.startsWith(todayStr))
  const confirmadas = marcacoesHoje.filter(m => m.estado === 'confirmado').length
  const pendentes = marcacoesHoje.filter(m => m.estado === 'pendente').length

  // ── Agenda do dia ─────────────────────────────────────────────
  const agendaDia = marcacoes
    .filter(m => isSameDay(new Date(m.data_hora), selectedDay))
    .sort((a, b) => a.data_hora.localeCompare(b.data_hora))

  // ── Submit form ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteNome.trim()) { setFormError('Introduz o nome do cliente.'); return }
    if (!selectedServico) { setFormError('Seleciona um serviço.'); return }
    if (!barbearia) return
    setFormError('')
    setSubmitting(true)
    const dataHora = new Date(`${dataForm}T${horaForm}:00`).toISOString()
    const { data: novaMarcacao, error } = await supabase.from('marcacoes').insert({
      barbearia_id: barbearia.id,
      cliente_nome: clienteNome.trim(),
      cliente_telemovel: clienteTel.trim() || null,
      servico_id: selectedServico.id,
      data_hora: dataHora,
      estado: 'pendente',
      sms_enviado: false,
    }).select('id').single()

    if (error) { setFormError('Erro ao agendar. Tenta novamente.'); setSubmitting(false); return }

    // Enviar SMS se toggle ativo, tem telemóvel e é para amanhã
    let smsMensagem = 'Marcação agendada!'
    if (smsToggle && clienteTel.trim() && novaMarcacao) {
      const dataAgendada = new Date(`${dataForm}T${horaForm}:00`)
      const amanha = new Date(today)
      amanha.setDate(amanha.getDate() + 1)
      const eAmanha = toDateStr(dataAgendada) === toDateStr(amanha)

      if (eAmanha) {
        try {
          const res = await fetch('/api/sms/enviar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ marcacao_id: novaMarcacao.id }),
          })
          const data = await res.json()
          smsMensagem = data.sucesso
            ? 'Marcação agendada! SMS enviado com sucesso ✓'
            : `Marcação agendada (SMS falhou: ${data.erro})`
        } catch {
          smsMensagem = 'Marcação agendada (SMS não enviado)'
        }
      } else {
        smsMensagem = 'Marcação agendada! SMS será enviado no dia anterior às 10:00.'
      }
    }

    setClienteNome('')
    setClienteTel('')
    setSelectedServico(null)
    setDataForm(toDateStr(today))
    setHoraForm('09:00')
    setSmsToggle(true)
    setSuccessMsg(smsMensagem)
    setTimeout(() => setSuccessMsg(''), 5000)
    setSubmitting(false)
    // Navigate calendar to the booked week
    const bookedDate = new Date(`${dataForm}T${horaForm}:00`)
    const ws = getMonday(bookedDate)
    setWeekStart(ws)
    setSelectedDay(new Date(bookedDate.getFullYear(), bookedDate.getMonth(), bookedDate.getDate()))
    fetchMarcacoes(barbearia.id, ws)
  }

  // ── Reenviar SMS ──────────────────────────────────────────────
  const handleReenviarSms = async (m: Marcacao) => {
    if (!m.cliente_telemovel) return
    try {
      // Temporariamente reset sms_enviado para permitir reenvio
      await supabase.from('marcacoes').update({ sms_enviado: false }).eq('id', m.id)
      const res = await fetch('/api/sms/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marcacao_id: m.id }),
      })
      const data = await res.json()
      setSuccessMsg(data.sucesso ? `SMS reenviado para ${m.cliente_nome} ✓` : `Erro: ${data.erro}`)
      setTimeout(() => setSuccessMsg(''), 4000)
      if (barbearia) fetchMarcacoes(barbearia.id, weekStart)
    } catch {
      setSuccessMsg('Erro ao reenviar SMS')
      setTimeout(() => setSuccessMsg(''), 4000)
    }
  }

  // ── Confirm appointment ───────────────────────────────────────
  const handleConfirmar = async (m: Marcacao) => {
    if (!barbearia) return
    await supabase.from('marcacoes').update({ estado: 'confirmado' }).eq('id', m.id)
    // Create faturacao record as 'pendente'
    if (m.servicos && m.servico_id) {
      await supabase.from('faturacao').insert({
        barbearia_id: barbearia.id,
        cliente_nome: m.cliente_nome,
        servico_id: m.servico_id,
        valor: m.servicos.preco,
        gorjeta: 0,
        estado: 'pendente',
        data_hora: m.data_hora,
      })
    }
    fetchMarcacoes(barbearia.id, weekStart)
  }

  const handleDesistencia = async (id: string) => {
    if (!barbearia) return
    await supabase.from('marcacoes').update({ estado: 'desistencia' }).eq('id', id)
    fetchMarcacoes(barbearia.id, weekStart)
  }

  // ── Toggle marcações online ───────────────────────────────────
  const toggleOnline = async () => {
    if (!barbearia) return
    setSavingOnline(true)
    const newVal = !marcacoesOnline
    const slug = barbearia.slug || generateSlug(barbearia.nome)
    const { error } = await supabase.from('barbearias')
      .update({ marcacoes_online: newVal, slug })
      .eq('id', barbearia.id)
    if (error) {
      console.error('Erro ao atualizar marcações online:', error)
      setFormError(`Erro ao guardar: ${error.message}`)
      setTimeout(() => setFormError(''), 5000)
      setSavingOnline(false)
      return
    }
    setMarcacoesOnline(newVal)
    setBarbearia(b => b ? { ...b, marcacoes_online: newVal, slug } : b)
    setSavingOnline(false)
  }

  const copyLink = () => {
    const slug = barbearia?.slug || ''
    navigator.clipboard.writeText(`https://fatura.pt/agendar/${slug}`)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  if (loadingInit) {
    return (
      <div className="space-y-6">
        <Sk className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Sk key={i} className="h-20"/>)}</div>
        <div className="flex flex-col lg:flex-row gap-4"><Sk className="flex-1 h-96"/><Sk className="w-full lg:w-[300px] h-96 lg:flex-shrink-0"/></div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0e4324]">Marcações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Agenda e gere os teus clientes</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Marcações hoje', value: marcacoesHoje.length, icon: '📅', color: 'text-[#0e4324]' },
          { label: 'Confirmadas', value: confirmadas, icon: '✅', color: 'text-green-600' },
          { label: 'Pendentes', value: pendentes, icon: '⏳', color: 'text-yellow-600' },
          { label: 'SMS enviados este mês', value: smsMes, icon: '📱', color: 'text-[#977c30]' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <span className="text-xl">{m.icon}</span>
            <p className={`text-3xl font-bold mt-2 ${m.color}`}>{m.value}</p>
            <p className="text-xs text-gray-500 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* LEFT: Calendar + Agenda */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Weekly Calendar */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Calendar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-[#0e4324]">Calendário semanal</h2>
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-2 py-1">
                <button
                  onClick={() => changeWeek(-1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-gray-500"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <span className="text-xs font-medium text-[#0e4324] min-w-[130px] text-center">
                  {weekDays[0].getDate()} {MESES_PT[weekDays[0].getMonth()]} – {weekDays[6].getDate()} {MESES_PT[weekDays[6].getMonth()]} {weekDays[6].getFullYear()}
                </span>
                <button
                  onClick={() => changeWeek(1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-gray-500"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="flex border-b border-gray-100">
              <div className="w-12 flex-shrink-0" />
              {weekDays.map(d => {
                const isToday = isSameDay(d, today)
                const isSelected = isSameDay(d, selectedDay)
                return (
                  <button
                    key={toDateStr(d)}
                    onClick={() => setSelectedDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                    className={`flex-1 py-2 text-center transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-[#f0f7f3]' : ''
                    }`}
                  >
                    <p className="text-[10px] text-gray-400 font-medium">{DIAS_PT[d.getDay()]}</p>
                    <div className={`w-6 h-6 rounded-full mx-auto mt-0.5 flex items-center justify-center text-xs font-bold ${
                      isToday ? 'bg-[#0e4324] text-white' : 'text-gray-700'
                    }`}>
                      {d.getDate()}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Time grid */}
            <div className="overflow-auto" style={{ maxHeight: 440 }}>
              <div className="flex">
                {/* Time labels */}
                <div className="w-12 flex-shrink-0">
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="flex items-start justify-end pr-2 text-[9px] text-gray-400 font-medium"
                      style={{ height: PX_PER_HOUR }}
                    >
                      <span className="-mt-1.5">{String(h).padStart(2, '0')}:00</span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map(d => {
                  const dayStr = toDateStr(d)
                  const isSelected = isSameDay(d, selectedDay)
                  const dayMarcacoes = marcacoes.filter(m => m.data_hora.startsWith(dayStr))
                  return (
                    <div
                      key={dayStr}
                      className={`flex-1 relative border-l border-gray-100 cursor-pointer ${isSelected ? 'bg-[#f0f7f3]/60' : ''}`}
                      style={{ height: HOURS.length * PX_PER_HOUR }}
                      onClick={() => setSelectedDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                    >
                      {/* Hour lines */}
                      {HOURS.map((h, idx) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 border-t border-gray-100"
                          style={{ top: idx * PX_PER_HOUR }}
                        />
                      ))}
                      {/* Appointments */}
                      {dayMarcacoes.map(m => (
                        <CalendarBlock
                          key={m.id}
                          m={m}
                          onClick={(e?: React.MouseEvent) => {
                            e?.stopPropagation?.()
                            setSelectedDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
                          }}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Agenda do dia */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0e4324]">
                Agenda — {isSameDay(selectedDay, today) ? 'Hoje' : selectedDay.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <span className="text-xs text-gray-400">{agendaDia.length} marcações</span>
            </div>

            {agendaDia.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-3xl mb-2">📅</span>
                <p className="text-sm font-medium text-gray-500">Sem marcações neste dia</p>
                <p className="text-xs text-gray-400 mt-0.5">Usa o formulário para agendar</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {agendaDia.map(m => {
                  const s = STATUS[m.estado]
                  return (
                    <div key={m.id} className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        {/* Time */}
                        <div className="flex-shrink-0 text-center w-12">
                          <p className="text-sm font-bold text-[#0e4324]">{formatHora(m.data_hora)}</p>
                          {m.servicos && (
                            <p className="text-[10px] text-gray-400 mt-0.5">{m.servicos.tempo_minutos}min</p>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-800">{m.cliente_nome}</p>
                            {/* SMS badge */}
                            {m.sms_enviado ? (
                              <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-medium">📱 SMS enviado</span>
                            ) : m.cliente_telemovel && m.estado !== 'desistencia' ? (
                              <span className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full font-medium">📱 SMS agendado</span>
                            ) : null}
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.pill}`}>{s.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {m.servicos?.nome ?? 'Serviço removido'}
                            {m.servicos?.preco ? ` · ${fmt(m.servicos.preco)}` : ''}
                          </p>
                          {m.cliente_telemovel && (
                            <p className="text-xs text-gray-400 mt-0.5">{m.cliente_telemovel}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {(m.estado === 'pendente' || (m.estado === 'confirmado' && m.cliente_telemovel)) && (
                        <div className="flex gap-2 mt-3 pl-16 flex-wrap">
                          {m.estado === 'pendente' && (
                            <>
                              <button
                                onClick={() => handleConfirmar(m)}
                                className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100 transition-colors"
                              >
                                ✓ Confirmar
                              </button>
                              <button
                                onClick={() => handleDesistencia(m.id)}
                                className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition-colors"
                              >
                                ✕ Desistência
                              </button>
                            </>
                          )}
                          {m.cliente_telemovel && (
                            <button
                              onClick={() => handleReenviarSms(m)}
                              className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                            >
                              📱 {m.sms_enviado ? 'Reenviar SMS' : 'Enviar SMS'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Config + Form */}
        <div className="w-full lg:w-[300px] lg:flex-shrink-0 space-y-4">

          {/* Online bookings card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#0e4324]">Marcações online</p>
                <p className="text-xs text-gray-400 mt-0.5">Clientes agendam pelo link</p>
              </div>
              <button
                onClick={toggleOnline}
                disabled={savingOnline}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                  marcacoesOnline ? 'bg-[#0e4324]' : 'bg-gray-200'
                }`}
              >
                {savingOnline ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </div>
                ) : (
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    marcacoesOnline ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                )}
              </button>
            </div>

            {!marcacoesOnline && !savingOnline && (
              <p className="text-[10px] text-gray-400 mb-2">
                Ativa para gerar o teu link de agendamento
              </p>
            )}

            {marcacoesOnline && barbearia?.slug && (
              <div className="bg-[#f0f7f3] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 mb-1.5 font-medium">Link público</p>
                <p className="text-xs text-[#0e4324] font-mono truncate mb-2">
                  fatura.pt/agendar/{barbearia.slug}
                </p>
                <button
                  onClick={copyLink}
                  className="w-full text-xs bg-[#0e4324] text-white py-1.5 rounded-lg font-medium hover:bg-[#0a3019] transition-colors"
                >
                  {linkCopiado ? '✓ Copiado!' : '📋 Copiar link'}
                </button>
              </div>
            )}
          </div>

          {/* New appointment form */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-[#0e4324] px-5 py-4">
              <h2 className="text-white font-semibold">Nova marcação</h2>
              <p className="text-white/60 text-xs mt-0.5">Agenda um novo cliente</p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nome do cliente *</label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={e => setClienteNome(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4324] focus:border-transparent placeholder-gray-400"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              {/* Telemóvel */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Telemóvel</label>
                <input
                  type="tel"
                  value={clienteTel}
                  onChange={e => setClienteTel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4324] focus:border-transparent placeholder-gray-400"
                  placeholder="+351 9XX XXX XXX"
                />
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Serviço *</label>
                <select
                  value={selectedServico?.id ?? ''}
                  onChange={e => {
                    const s = servicos.find(s => s.id === e.target.value) ?? null
                    setSelectedServico(s)
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4324] bg-white text-gray-800"
                  required
                >
                  <option value="">Seleciona um serviço</option>
                  {servicos.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
                {selectedServico && (
                  <div className="flex items-center gap-3 mt-1.5 px-1">
                    <span className="text-xs text-[#977c30] font-semibold">{fmt(selectedServico.preco)}</span>
                    <span className="text-xs text-gray-400">{selectedServico.tempo_minutos} min</span>
                  </div>
                )}
              </div>

              {/* Data + Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Data *</label>
                  <input
                    type="date"
                    value={dataForm}
                    onChange={e => setDataForm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4324] text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Hora *</label>
                  <select
                    value={horaForm}
                    onChange={e => setHoraForm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4324] bg-white text-gray-800"
                  >
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* SMS toggle */}
              <div className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-3">
                <div>
                  <p className="text-xs font-medium text-blue-800">Lembrete por SMS</p>
                  <p className="text-[10px] text-blue-600 mt-0.5">Enviado automaticamente 24h antes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsToggle(v => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${smsToggle ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${smsToggle ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {formError && (
                <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg border border-red-100">{formError}</p>
              )}
              {successMsg && (
                <p className="text-green-700 text-xs bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                  ✓ {successMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0e4324] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0a3019] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    A agendar...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    Agendar marcação
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
