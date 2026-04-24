'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────
interface Marcacao {
  id: string
  cliente_nome: string
  cliente_telemovel: string | null
  cliente_id: string | null
  servico_id: string | null
  data_hora: string
  estado: 'pendente' | 'confirmado' | 'concluido' | 'desistencia'
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

interface Bloqueio {
  id: string
  data: string
  hora_inicio: string
  hora_fim: string
  motivo: string | null
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
  confirmado: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', badge: 'badge-green', label: 'Confirmado' },
  pendente:   { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'badge-amber', label: 'Pendente' },
  concluido:  { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',  badge: 'badge-gray',  label: 'Concluído' },
  desistencia:{ bg: 'bg-red-100',    border: 'border-red-300',    text: 'text-red-700',   badge: 'badge-red',   label: 'Desistência' },
}

// ── Helpers ────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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

function generateSlug(nome: string): string {
  return nome.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 30)
}

// ── Skeleton ───────────────────────────────────────────────────────
function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f0eee8] rounded-xl ${className}`} />
}

// ── Toggle Switch ──────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        checked ? 'bg-verde' : 'bg-[#d4d4cc]'
      }`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  )
}

// ── Bloqueio Block ─────────────────────────────────────────────────
function BloqueioBlock({ b }: { b: Bloqueio }) {
  const [hI, mI] = b.hora_inicio.slice(0, 5).split(':').map(Number)
  const [hF, mF] = b.hora_fim.slice(0, 5).split(':').map(Number)
  const startMin = (hI - CALENDAR_START) * 60 + mI
  const durMin   = (hF - hI) * 60 + (mF - mI)
  const top    = (startMin / 60) * PX_PER_HOUR
  const height = Math.max((durMin / 60) * PX_PER_HOUR, 24)
  return (
    <div
      className="absolute left-0.5 right-0.5 rounded-md border border-orange-300 bg-orange-100/80 px-1 py-0.5 overflow-hidden pointer-events-none"
      style={{ top, height, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(251,146,60,0.15) 4px, rgba(251,146,60,0.15) 8px)' }}
    >
      <p className="text-[9px] font-semibold text-orange-700 leading-tight truncate">
        {b.motivo || 'Bloqueado'}
      </p>
    </div>
  )
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
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([])
  const [smsMes, setSmsMes] = useState(0)
  const [loadingInit, setLoadingInit] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [processando, setProcessando] = useState<Set<string>>(new Set())
  const [successMsg, setSuccessMsg] = useState('')
  const [formError, setFormError] = useState('')

  // Bloqueios form
  const [showBloqueioForm, setShowBloqueioForm] = useState(false)
  const [bloqueioData, setBloqueioData] = useState('')
  const [bloqueioInicio, setBloqueioInicio] = useState('09:00')
  const [bloqueioFim, setBloqueioFim] = useState('19:00')
  const [bloqueioMotivo, setBloqueioMotivo] = useState('')
  const [criandoBloqueio, setCriandoBloqueio] = useState(false)

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

  // ── Fetch marcações e bloqueios da semana ──────────────────────
  const fetchMarcacoes = useCallback(async (bid: string, ws: Date) => {
    const start = toDateStr(ws)
    const end   = toDateStr(addDays(ws, 7))
    const [{ data: marcData }, { data: bloqData }] = await Promise.all([
      supabase
        .from('marcacoes')
        .select('id, cliente_nome, cliente_telemovel, cliente_id, servico_id, data_hora, estado, sms_enviado, servicos(nome, preco, tempo_minutos)')
        .eq('barbearia_id', bid)
        .gte('data_hora', `${start}T00:00:00`)
        .lt('data_hora',  `${end}T00:00:00`)
        .order('data_hora'),
      supabase
        .from('bloqueios')
        .select('id, data, hora_inicio, hora_fim, motivo')
        .eq('barbearia_id', bid)
        .gte('data', start)
        .lt('data',  end)
        .order('data'),
    ])
    setMarcacoes((marcData as unknown as Marcacao[]) ?? [])
    setBloqueios((bloqData as unknown as Bloqueio[]) ?? [])
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

    // CRM match por telemóvel
    let clienteId: string | null = null
    const tel = clienteTel.trim()
    if (tel && !/^\d{9}$/.test(tel)) {
      setFormError('Telemóvel inválido. Usa 9 dígitos sem espaços (ex: 912345678).')
      setSubmitting(false)
      return
    }
    if (tel) {
      const { data: clienteExistente } = await supabase
        .from('clientes').select('id')
        .eq('barbearia_id', barbearia.id).eq('telemovel', tel).single()
      if (clienteExistente) {
        clienteId = clienteExistente.id
        await supabase.from('clientes').update({ nome: clienteNome.trim() }).eq('id', clienteId)
      } else {
        const { data: novoCliente } = await supabase.from('clientes').insert({
          barbearia_id: barbearia.id,
          nome: clienteNome.trim(),
          telemovel: tel,
        }).select('id').single()
        if (novoCliente) clienteId = novoCliente.id
      }
    }

    // Verificar sobreposição com marcações existentes
    const novoInicio = new Date(dataHora).getTime()
    const novoDurMs = selectedServico.tempo_minutos * 60000
    const novoFim = novoInicio + novoDurMs

    const { data: existentes } = await supabase
      .from('marcacoes')
      .select('data_hora, servicos(tempo_minutos)')
      .eq('barbearia_id', barbearia.id)
      .in('estado', ['pendente', 'confirmado'])
      .gte('data_hora', `${dataForm}T00:00:00`)
      .lte('data_hora', `${dataForm}T23:59:59`)

    const conflito = (existentes ?? []).some(ex => {
      const exInicio = new Date(ex.data_hora).getTime()
      const exDur = ((ex.servicos as unknown as { tempo_minutos: number } | null)?.tempo_minutos ?? 30) * 60000
      const exFim = exInicio + exDur
      return novoInicio < exFim && novoFim > exInicio
    })

    if (conflito) {
      setFormError('Já existe uma marcação nesse horário. Escolhe outro horário.')
      setSubmitting(false)
      return
    }

    const { data: novaMarcacao, error } = await supabase.from('marcacoes').insert({
      barbearia_id: barbearia.id,
      cliente_nome: clienteNome.trim(),
      cliente_telemovel: tel || null,
      cliente_id: clienteId,
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
            ? 'Marcação agendada! SMS enviado com sucesso.'
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
      await supabase.from('marcacoes').update({ sms_enviado: false }).eq('id', m.id)
      const res = await fetch('/api/sms/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marcacao_id: m.id }),
      })
      const data = await res.json()
      setSuccessMsg(data.sucesso ? `SMS reenviado para ${m.cliente_nome}.` : `Erro: ${data.erro}`)
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
    // SMS de confirmação (fire-and-forget)
    if (m.cliente_telemovel) {
      fetch('/api/sms/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marcacao_id: m.id, tipo: 'confirmada' }),
      }).catch(() => {})
    }
    fetchMarcacoes(barbearia.id, weekStart)
  }

  // ── Concluir serviço → cria entrada em faturação ──────────────
  const handleConcluir = async (m: Marcacao) => {
    if (!barbearia || processando.has(m.id)) return
    setProcessando(prev => { const next = new Set(prev); next.add(m.id); return next })
    // Atualiza estado localmente de imediato para o botão desaparecer
    setMarcacoes(prev => prev.map(x => x.id === m.id ? { ...x, estado: 'concluido' as const } : x))
    await supabase.from('marcacoes').update({ estado: 'concluido' }).eq('id', m.id)
    if (m.servicos && m.servico_id) {
      await supabase.from('faturacao').insert({
        barbearia_id: barbearia.id,
        cliente_nome: m.cliente_nome,
        cliente_id:   m.cliente_id ?? null,
        servico_id:   m.servico_id,
        valor:        m.servicos.preco,
        gorjeta:      0,
        estado:       'concluido',
        data_hora:    new Date().toISOString(),
      })
    }
    setProcessando(prev => { const next = new Set(prev); next.delete(m.id); return next })
    fetchMarcacoes(barbearia.id, weekStart)
  }

  const handleDesistencia = async (m: Marcacao) => {
    if (!barbearia) return
    await supabase.from('marcacoes').update({ estado: 'desistencia' }).eq('id', m.id)
    // SMS de cancelamento (fire-and-forget)
    if (m.cliente_telemovel) {
      fetch('/api/sms/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marcacao_id: m.id, tipo: 'cancelada' }),
      }).catch(() => {})
    }
    fetchMarcacoes(barbearia.id, weekStart)
  }

  // ── Bloqueios ─────────────────────────────────────────────────
  const criarBloqueio = async () => {
    if (!barbearia || !bloqueioData || !bloqueioInicio || !bloqueioFim) return
    if (bloqueioInicio >= bloqueioFim) {
      setFormError('A hora de fim deve ser depois da hora de início.')
      setTimeout(() => setFormError(''), 3000)
      return
    }
    setCriandoBloqueio(true)
    const { error } = await supabase.from('bloqueios').insert({
      barbearia_id: barbearia.id,
      data:         bloqueioData,
      hora_inicio:  bloqueioInicio,
      hora_fim:     bloqueioFim,
      motivo:       bloqueioMotivo.trim() || null,
    })
    setCriandoBloqueio(false)
    if (error) { setFormError('Erro ao criar bloqueio.'); setTimeout(() => setFormError(''), 3000); return }
    setBloqueioMotivo('')
    setShowBloqueioForm(false)
    setSuccessMsg('Horário bloqueado ✓')
    setTimeout(() => setSuccessMsg(''), 3000)
    fetchMarcacoes(barbearia.id, weekStart)
  }

  const eliminarBloqueio = async (id: string) => {
    if (!barbearia) return
    await supabase.from('bloqueios').delete().eq('id', id)
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
    navigator.clipboard.writeText(`${window.location.origin}/agendar/${slug}`)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  // ── Loading ───────────────────────────────────────────────────
  if (loadingInit) {
    return (
      <div className="space-y-6">
        <Sk className="h-9 w-52" />
        <div className="flex gap-3">
          {[1,2,3].map(i => <Sk key={i} className="h-8 w-32" />)}
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <Sk className="flex-1 h-[500px]" />
          <Sk className="w-full lg:w-[380px] h-[500px] lg:flex-shrink-0" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Marcações</h1>
          <p className="text-sm text-ink-secondary mt-0.5">Agenda e gestão de clientes</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/5 text-sm">
          <span className="material-symbols-outlined text-ink-secondary" style={{fontSize:'15px'}}>calendar_today</span>
          <span className="text-ink font-medium">{marcacoesHoje.length}</span>
          <span className="text-ink-secondary">hoje</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/5 text-sm">
          <span className="material-symbols-outlined text-amber-500" style={{fontSize:'15px'}}>schedule</span>
          <span className="text-ink font-medium">{pendentes}</span>
          <span className="text-ink-secondary">pendentes</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/5 text-sm">
          <span className="material-symbols-outlined text-verde" style={{fontSize:'15px'}}>check_circle</span>
          <span className="text-ink font-medium">{confirmadas}</span>
          <span className="text-ink-secondary">confirmadas</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/5 text-sm">
          <span className="material-symbols-outlined text-dourado" style={{fontSize:'15px'}}>sms</span>
          <span className="text-ink font-medium">{smsMes}</span>
          <span className="text-ink-secondary">SMS este mês</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* LEFT: Calendar + Agenda */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Mobile day selector — lg:hidden */}
          <div className="lg:hidden card overflow-hidden !p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
              <button onClick={() => changeWeek(-1)} className="btn-ghost !p-2">
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>chevron_left</span>
              </button>
              <span className="text-sm font-medium text-ink">
                {weekDays[0].getDate()} {MESES_PT[weekDays[0].getMonth()]} – {weekDays[6].getDate()} {MESES_PT[weekDays[6].getMonth()]} {weekDays[6].getFullYear()}
              </span>
              <button onClick={() => changeWeek(1)} className="btn-ghost !p-2">
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>chevron_right</span>
              </button>
            </div>
            <div className="flex overflow-x-auto px-3 py-3 gap-1.5 scrollbar-none">
              {weekDays.map(d => {
                const isToday = isSameDay(d, today)
                const isSelected = isSameDay(d, selectedDay)
                const hasMarcacoes = marcacoes.some(m => m.data_hora.startsWith(toDateStr(d)))
                return (
                  <button
                    key={toDateStr(d)}
                    onClick={() => setSelectedDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                    className="flex flex-col items-center flex-shrink-0 w-11 py-2 rounded-xl transition-all"
                    style={isSelected ? { backgroundColor: 'rgb(var(--verde))' } : isToday ? { backgroundColor: 'rgb(var(--verde) / 0.08)' } : {}}
                  >
                    <span className={`text-[10px] font-medium uppercase tracking-wide ${isSelected ? 'text-white/70' : 'text-ink-secondary'}`}>{DIAS_PT[d.getDay()]}</span>
                    <span className={`text-base font-bold mt-0.5 ${isSelected ? 'text-white' : isToday ? 'text-verde' : 'text-ink'}`}>{d.getDate()}</span>
                    {hasMarcacoes && <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white/60' : 'bg-verde'}`} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Weekly Calendar — desktop only */}
          <div className="hidden lg:block card overflow-hidden !p-0">
            {/* Calendar header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
              <h2 className="section-title !mb-0">Calendário semanal</h2>
              <div className="flex items-center gap-1 bg-[#f0eee8] rounded-xl px-2 py-1.5">
                <button
                  onClick={() => changeWeek(-1)}
                  className="btn-ghost !p-1 !rounded-lg"
                >
                  <span className="material-symbols-outlined" style={{fontSize:'16px'}}>chevron_left</span>
                </button>
                <span className="text-xs font-medium text-ink min-w-[140px] text-center">
                  {weekDays[0].getDate()} {MESES_PT[weekDays[0].getMonth()]} – {weekDays[6].getDate()} {MESES_PT[weekDays[6].getMonth()]} {weekDays[6].getFullYear()}
                </span>
                <button
                  onClick={() => changeWeek(1)}
                  className="btn-ghost !p-1 !rounded-lg"
                >
                  <span className="material-symbols-outlined" style={{fontSize:'16px'}}>chevron_right</span>
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="flex border-b border-black/5">
              <div className="w-12 flex-shrink-0" />
              {weekDays.map(d => {
                const isToday = isSameDay(d, today)
                const isSelected = isSameDay(d, selectedDay)
                return (
                  <button
                    key={toDateStr(d)}
                    onClick={() => setSelectedDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                    className={`flex-1 py-2.5 text-center transition-colors hover:bg-[#f0eee8] ${
                      isSelected ? 'bg-[#f0eee8]' : ''
                    }`}
                  >
                    <p className="text-[10px] text-ink-secondary font-medium tracking-wide uppercase">{DIAS_PT[d.getDay()]}</p>
                    <div className={`w-6 h-6 rounded-full mx-auto mt-0.5 flex items-center justify-center text-xs font-bold ${
                      isToday ? 'bg-verde text-white' : 'text-ink'
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
                      className="flex items-start justify-end pr-2 text-[9px] text-ink-secondary font-medium"
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
                      className={`flex-1 relative border-l border-black/5 cursor-pointer ${isSelected ? 'bg-[#f0eee8]/50' : ''}`}
                      style={{ height: HOURS.length * PX_PER_HOUR }}
                      onClick={() => setSelectedDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                    >
                      {HOURS.map((h, idx) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 border-t border-black/[0.04]"
                          style={{ top: idx * PX_PER_HOUR }}
                        />
                      ))}
                      {bloqueios.filter(b => b.data === dayStr).map(b => (
                        <BloqueioBlock key={b.id} b={b} />
                      ))}
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
          <div className="card overflow-hidden !p-0">
            <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
              <h2 className="section-title !mb-0">
                Agenda — {isSameDay(selectedDay, today) ? 'Hoje' : selectedDay.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <span className="text-xs text-ink-secondary">{agendaDia.length} marcações</span>
            </div>

            {agendaDia.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#f0eee8] flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-ink-secondary" style={{fontSize:'24px'}}>event_available</span>
                </div>
                <p className="text-sm font-medium text-ink">Sem marcações neste dia</p>
                <p className="text-xs text-ink-secondary mt-0.5">Usa o formulário para agendar</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {agendaDia.map(m => {
                  const s = STATUS[m.estado]
                  return (
                    <div key={m.id} className="px-5 py-4 hover:bg-[#f0eee8]/40 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Time column */}
                        <div className="flex-shrink-0 text-center w-14">
                          <p className="text-sm font-medium text-ink">{formatHora(m.data_hora)}</p>
                          {m.servicos && (
                            <p className="text-xs text-ink-secondary mt-0.5">{m.servicos.tempo_minutos}min</p>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-10 bg-black/10 flex-shrink-0" />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-ink">{m.cliente_nome}</p>
                            <span className={`badge ${s.badge}`}>{s.label}</span>
                            {m.sms_enviado && (
                              <span className="material-symbols-outlined text-verde" style={{fontSize:'15px'}} title="SMS enviado">check_circle</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {m.servicos && (
                              <span className="text-xs text-ink-secondary bg-[#f0eee8] px-2 py-0.5 rounded-full">
                                {m.servicos.nome}
                              </span>
                            )}
                            {m.servicos?.preco ? (
                              <span className="text-xs text-dourado font-medium">{fmt(m.servicos.preco)}</span>
                            ) : null}
                            {m.cliente_telemovel && (
                              <span className="text-xs text-ink-secondary">{m.cliente_telemovel}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {m.estado === 'pendente' && (
                            <>
                              <button
                                onClick={() => handleConfirmar(m)}
                                className="btn-ghost !p-2 text-verde"
                                title="Confirmar marcação"
                              >
                                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>check</span>
                              </button>
                              <button
                                onClick={() => handleDesistencia(m)}
                                className="btn-ghost !p-2 text-red-600"
                                title="Desistência"
                              >
                                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span>
                              </button>
                            </>
                          )}
                          {m.estado === 'confirmado' && (
                            <>
                              <button
                                onClick={() => handleConcluir(m)}
                                disabled={processando.has(m.id)}
                                className="btn-ghost !p-2 text-verde disabled:opacity-40"
                                title="Concluir serviço — regista em faturação"
                              >
                                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>task_alt</span>
                              </button>
                              <button
                                onClick={() => handleDesistencia(m)}
                                className="btn-ghost !p-2 text-red-600"
                                title="Desistência"
                              >
                                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>close</span>
                              </button>
                            </>
                          )}
                          {m.cliente_telemovel && m.estado !== 'concluido' && m.estado !== 'desistencia' && (
                            <button
                              onClick={() => handleReenviarSms(m)}
                              className="btn-ghost !p-2 text-ink-secondary"
                              title={m.sms_enviado ? 'Reenviar SMS' : 'Enviar SMS'}
                            >
                              <span className="material-symbols-outlined" style={{fontSize:'18px'}}>sms</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Config + Form */}
        <div className="w-full lg:w-[380px] lg:flex-shrink-0 space-y-4">

          {/* Online bookings card */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f0eee8] flex items-center justify-center">
                  <span className="material-symbols-outlined text-verde" style={{fontSize:'20px'}}>public</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Marcações online</p>
                  <p className="text-xs text-ink-secondary">Permite que clientes marquem pelo link</p>
                </div>
              </div>
              {savingOnline ? (
                <svg className="animate-spin w-5 h-5 text-ink-secondary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <ToggleSwitch checked={marcacoesOnline} onChange={toggleOnline} />
              )}
            </div>

            {!marcacoesOnline && !savingOnline && (
              <p className="text-xs text-ink-secondary mt-3">
                Ativa para gerar o teu link de agendamento público.
              </p>
            )}

            {marcacoesOnline && barbearia?.slug && (
              <div className="mt-4 bg-[#f0eee8] rounded-xl p-3">
                <p className="text-[10px] text-ink-secondary uppercase tracking-widest font-medium mb-1.5">Link público</p>
                <p className="text-xs text-verde font-mono truncate mb-3">
                  {typeof window !== 'undefined' ? window.location.host : 'fatura-mais.pt'}/agendar/{barbearia.slug}
                </p>
                <button
                  onClick={copyLink}
                  className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined" style={{fontSize:'15px'}}>
                    {linkCopiado ? 'check' : 'content_copy'}
                  </span>
                  {linkCopiado ? 'Copiado!' : 'Copiar link'}
                </button>
              </div>
            )}
          </div>

          {/* Bloqueios de horário */}
          <div className="card !p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-orange-500" style={{fontSize:'20px'}}>block</span>
                <h2 className="section-title !mb-0">Bloqueios de horário</h2>
              </div>
              <button
                onClick={() => { setShowBloqueioForm(v => !v); setBloqueioData(toDateStr(selectedDay)) }}
                className="btn-ghost !p-1.5 !rounded-lg text-ink-secondary"
                title="Adicionar bloqueio"
              >
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>{showBloqueioForm ? 'close' : 'add'}</span>
              </button>
            </div>

            {showBloqueioForm && (
              <div className="p-5 border-b border-black/5 space-y-3 bg-[#fff8f3]">
                <p className="text-xs font-medium text-ink-secondary uppercase tracking-wide">Novo bloqueio</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-medium text-ink-secondary mb-1 uppercase tracking-wide">Data</label>
                    <input
                      type="date"
                      value={bloqueioData}
                      onChange={e => setBloqueioData(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-ink-secondary mb-1 uppercase tracking-wide">Das</label>
                    <select value={bloqueioInicio} onChange={e => setBloqueioInicio(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400 transition-colors">
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-ink-secondary mb-1 uppercase tracking-wide">Até</label>
                    <select value={bloqueioFim} onChange={e => setBloqueioFim(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400 transition-colors">
                      {[...TIME_OPTIONS, '19:00'].filter(t => t > bloqueioInicio).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-medium text-ink-secondary mb-1 uppercase tracking-wide">Motivo (opcional)</label>
                    <input
                      type="text"
                      value={bloqueioMotivo}
                      onChange={e => setBloqueioMotivo(e.target.value)}
                      placeholder="Ex: Formação, pausa, feriado..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>
                </div>
                <button
                  onClick={criarBloqueio}
                  disabled={criandoBloqueio || !bloqueioData}
                  className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
                >
                  {criandoBloqueio ? 'A bloquear...' : 'Bloquear horário'}
                </button>
              </div>
            )}

            {/* Lista de bloqueios da semana */}
            <div className="divide-y divide-black/[0.04]">
              {bloqueios.length === 0 ? (
                <p className="text-xs text-ink-secondary text-center py-5">Sem bloqueios esta semana.</p>
              ) : (
                bloqueios.map(b => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="material-symbols-outlined text-orange-400 flex-shrink-0" style={{fontSize:'16px'}}>block</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink">
                        {new Date(b.data + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' · '}
                        {b.hora_inicio.slice(0,5)}–{b.hora_fim.slice(0,5)}
                      </p>
                      {b.motivo && <p className="text-[11px] text-ink-secondary truncate">{b.motivo}</p>}
                    </div>
                    <button
                      onClick={() => eliminarBloqueio(b.id)}
                      className="btn-ghost !p-1.5 !rounded-md text-ink-secondary hover:text-red-600 flex-shrink-0"
                      title="Remover bloqueio"
                    >
                      <span className="material-symbols-outlined" style={{fontSize:'15px'}}>delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New appointment form */}
          <div className="card !p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-black/5 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-verde" style={{fontSize:'20px'}}>calendar_today</span>
              <h2 className="section-title !mb-0">Nova Marcação</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                  Nome do cliente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={e => setClienteNome(e.target.value)}
                  className="input-field w-full"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              {/* Telemóvel */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">Telemóvel</label>
                <input
                  type="tel"
                  value={clienteTel}
                  onChange={e => setClienteTel(e.target.value)}
                  className="input-field w-full"
                  placeholder="+351 9XX XXX XXX"
                />
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                  Serviço <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedServico?.id ?? ''}
                  onChange={e => {
                    const s = servicos.find(s => s.id === e.target.value) ?? null
                    setSelectedServico(s)
                  }}
                  className="input-field w-full"
                  required
                >
                  <option value="">Seleciona um serviço</option>
                  {servicos.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
                {selectedServico && (
                  <div className="flex items-center gap-3 mt-2 px-1">
                    <span className="text-xs text-dourado font-semibold">{fmt(selectedServico.preco)}</span>
                    <span className="text-xs text-ink-secondary">{selectedServico.tempo_minutos} min</span>
                  </div>
                )}
              </div>

              {/* Data + Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dataForm}
                    onChange={e => setDataForm(e.target.value)}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                    Hora <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={horaForm}
                    onChange={e => setHoraForm(e.target.value)}
                    className="input-field w-full"
                  >
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* SMS toggle */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#f0eee8] cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-verde" style={{fontSize:'18px'}}>sms</span>
                  <div>
                    <p className="text-sm font-medium text-ink">Enviar SMS de confirmação</p>
                    <p className="text-[10px] text-ink-secondary mt-0.5">Enviado automaticamente 24h antes</p>
                  </div>
                </div>
                <ToggleSwitch checked={smsToggle} onChange={() => setSmsToggle(v => !v)} />
              </label>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                  <span className="material-symbols-outlined text-red-600" style={{fontSize:'16px'}}>error</span>
                  <p className="text-red-700 text-xs">{formError}</p>
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f0eee8] border border-verde/10">
                  <span className="material-symbols-outlined text-verde" style={{fontSize:'16px'}}>check_circle</span>
                  <p className="text-verde text-xs font-medium">{successMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
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
                    <span className="material-symbols-outlined" style={{fontSize:'18px'}}>add</span>
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
