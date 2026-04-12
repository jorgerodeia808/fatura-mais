'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

// ── Types ────────────────────────────────────────────────────────
interface Servico {
  nome: string
  preco: string
  tempo_minutos: string
  custo_material: string
}

interface CustoFixo {
  descricao: string
  valor: string
  tipo: 'fixo' | 'variavel'
  categoria: string
}

// ── Logo ─────────────────────────────────────────────────────────
function Logo() {
  return (
    <Image src="/images/Logo_F_.png" alt="Fatura+" width={48} height={48} />
  )
}

// ── Step Indicator ────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step < current
                ? 'bg-verde text-white'
                : step === current
                ? 'bg-dourado text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {step < current ? '✓' : step}
          </div>
          {step < total && (
            <div className={`w-12 h-0.5 ${step < current ? 'bg-verde' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Barbearia ─────────────────────────────────────────────
function Step1({
  data,
  onChange,
}: {
  data: { nome: string; num_barbeiros: string; hora_abertura: string; hora_fecho: string; dias_trabalho_mes: string }
  onChange: (field: string, value: string) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-verde">A tua barbearia</h2>
        <p className="text-gray-500 mt-1">Conta-nos um pouco sobre o teu negócio</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da barbearia *</label>
        <input
          type="text"
          value={data.nome}
          onChange={(e) => onChange('nome', e.target.value)}
          className="input-field"
          placeholder="Ex: Barbearia do João"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de barbeiros</label>
        <input
          type="number"
          value={data.num_barbeiros}
          onChange={(e) => onChange('num_barbeiros', e.target.value)}
          className="input-field"
          placeholder="Ex: 3"
          min="1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora de abertura</label>
          <input
            type="time"
            value={data.hora_abertura}
            onChange={(e) => onChange('hora_abertura', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora de fecho</label>
          <input
            type="time"
            value={data.hora_fecho}
            onChange={(e) => onChange('hora_fecho', e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Dias de trabalho por mês
        </label>
        <input
          type="number"
          value={data.dias_trabalho_mes}
          onChange={(e) => onChange('dias_trabalho_mes', e.target.value)}
          className="input-field"
          placeholder="Ex: 22"
          min="1"
          max="31"
        />
      </div>
    </div>
  )
}

// ── Step 2: Serviços ──────────────────────────────────────────────
function Step2({
  servicos,
  onChange,
  onAdd,
  onRemove,
}: {
  servicos: Servico[]
  onChange: (index: number, field: keyof Servico, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-verde">Os teus serviços</h2>
        <p className="text-gray-500 mt-1">Adiciona os serviços que ofereces na tua barbearia</p>
      </div>

      <div className="space-y-4">
        {servicos.map((s, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
            {servicos.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome do serviço</label>
                <input
                  type="text"
                  value={s.nome}
                  onChange={(e) => onChange(i, 'nome', e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="Ex: Corte de cabelo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Preço (€)</label>
                <input
                  type="number"
                  value={s.preco}
                  onChange={(e) => onChange(i, 'preco', e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tempo (min)</label>
                <input
                  type="number"
                  value={s.tempo_minutos}
                  onChange={(e) => onChange(i, 'tempo_minutos', e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="30"
                  min="1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Custo de material (€)</label>
                <input
                  type="number"
                  value={s.custo_material}
                  onChange={(e) => onChange(i, 'custo_material', e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="w-full border-2 border-dashed border-dourado text-dourado py-3 rounded-xl font-medium hover:bg-dourado/5 transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-xl">+</span> Adicionar serviço
      </button>
    </div>
  )
}

// ── Step 3: Custos Fixos ──────────────────────────────────────────
function Step3({
  custos,
  onChange,
  onAdd,
  onRemove,
}: {
  custos: CustoFixo[]
  onChange: (index: number, field: keyof CustoFixo, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  const categorias = ['Rendas', 'Água/Luz/Gás', 'Internet/Telefone', 'Seguros', 'Contabilidade', 'Marketing', 'Software', 'Equipamento', 'Outro']

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-verde">Custos mensais</h2>
        <p className="text-gray-500 mt-1">Regista os teus custos fixos e variáveis mensais</p>
      </div>

      <div className="space-y-4">
        {custos.map((c, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
            {custos.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                <input
                  type="text"
                  value={c.descricao}
                  onChange={(e) => onChange(i, 'descricao', e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="Ex: Renda do espaço"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor (€/mês)</label>
                <input
                  type="number"
                  value={c.valor}
                  onChange={(e) => onChange(i, 'valor', e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                <select
                  value={c.tipo}
                  onChange={(e) => onChange(i, 'tipo', e.target.value as 'fixo' | 'variavel')}
                  className="input-field text-sm py-2"
                >
                  <option value="fixo">Fixo</option>
                  <option value="variavel">Variável</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                <select
                  value={c.categoria}
                  onChange={(e) => onChange(i, 'categoria', e.target.value)}
                  className="input-field text-sm py-2"
                >
                  <option value="">Seleciona...</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="w-full border-2 border-dashed border-dourado text-dourado py-3 rounded-xl font-medium hover:bg-dourado/5 transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-xl">+</span> Adicionar custo
      </button>
    </div>
  )
}

// ── Main Onboarding Page ──────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 data
  const [barbearia, setBarbearia] = useState({
    nome: '',
    num_barbeiros: '',
    hora_abertura: '09:00',
    hora_fecho: '19:00',
    dias_trabalho_mes: '22',
  })

  // Step 2 data
  const [servicos, setServicos] = useState<Servico[]>([
    { nome: '', preco: '', tempo_minutos: '', custo_material: '' },
  ])

  // Step 3 data
  const [custos, setCustos] = useState<CustoFixo[]>([
    { descricao: '', valor: '', tipo: 'fixo', categoria: '' },
  ])

  const handleBarbeariaChange = (field: string, value: string) => {
    setBarbearia((prev) => ({ ...prev, [field]: value }))
  }

  const handleServicoChange = (i: number, field: keyof Servico, value: string) => {
    setServicos((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  }

  const handleCustoChange = (i: number, field: keyof CustoFixo, value: string) => {
    setCustos((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)))
  }

  const nextStep = () => {
    if (step === 1 && !barbearia.nome.trim()) {
      setError('Por favor, introduz o nome da barbearia.')
      return
    }
    setError('')
    setStep((s) => s + 1)
  }

  const prevStep = () => setStep((s) => s - 1)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // Insert barbearia
      const { data: barb, error: barbErr } = await supabase
        .from('barbearias')
        .insert({
          user_id: user.id,
          nome: barbearia.nome.trim(),
          num_barbeiros: parseInt(barbearia.num_barbeiros) || 1,
          hora_abertura: barbearia.hora_abertura,
          hora_fecho: barbearia.hora_fecho,
          dias_trabalho_mes: parseInt(barbearia.dias_trabalho_mes) || 22,
          plano: 'trial',
          trial_termina_em: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      if (barbErr) throw barbErr

      const barbearia_id = barb.id

      // Insert servicos válidos
      const servicosValidos = servicos.filter((s) => s.nome.trim())
      if (servicosValidos.length > 0) {
        const { error: servErr } = await supabase.from('servicos').insert(
          servicosValidos.map((s) => ({
            barbearia_id,
            nome: s.nome.trim(),
            preco: parseFloat(s.preco) || 0,
            tempo_minutos: parseInt(s.tempo_minutos) || 30,
            custo_material: parseFloat(s.custo_material) || 0,
            comissao_percentagem: 0,
            ativo: true,
          }))
        )
        if (servErr) throw servErr
      }

      // Insert custos válidos
      const custosValidos = custos.filter((c) => c.descricao.trim())
      if (custosValidos.length > 0) {
        const { error: custErr } = await supabase.from('custos_fixos').insert(
          custosValidos.map((c) => ({
            barbearia_id,
            descricao: c.descricao.trim(),
            valor: parseFloat(c.valor) || 0,
            tipo: c.tipo,
            categoria: c.categoria || 'Outro',
          }))
        )
        if (custErr) throw custErr
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar configuração.')
      setLoading(false)
    }
  }

  const stepTitles = ['A tua barbearia', 'Os teus serviços', 'Custos mensais']

  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-xl font-bold text-verde">
              Fatura<span className="text-dourado">+</span>
            </span>
          </div>
          <StepIndicator current={step} total={3} />
        </div>

        <div className="mb-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Passo {step} de 3 — {stepTitles[step - 1]}
          </span>
        </div>

        {/* Card */}
        <div className="card">
          {step === 1 && (
            <Step1 data={barbearia} onChange={handleBarbeariaChange} />
          )}
          {step === 2 && (
            <Step2
              servicos={servicos}
              onChange={handleServicoChange}
              onAdd={() => setServicos((p) => [...p, { nome: '', preco: '', tempo_minutos: '', custo_material: '' }])}
              onRemove={(i) => setServicos((p) => p.filter((_, idx) => idx !== i))}
            />
          )}
          {step === 3 && (
            <Step3
              custos={custos}
              onChange={handleCustoChange}
              onAdd={() => setCustos((p) => [...p, { descricao: '', valor: '', tipo: 'fixo', categoria: '' }])}
              onRemove={(i) => setCustos((p) => p.filter((_, idx) => idx !== i))}
            />
          )}

          {error && (
            <div className="mt-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button type="button" onClick={prevStep} className="btn-secondary text-sm px-5 py-2.5">
                ← Anterior
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button type="button" onClick={nextStep} className="btn-primary text-sm px-5 py-2.5">
                Seguinte →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-dourado text-sm px-6 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    A guardar...
                  </>
                ) : (
                  'Concluir configuração ✓'
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Podes alterar estas configurações mais tarde nas definições
        </p>
      </div>
    </div>
  )
}
