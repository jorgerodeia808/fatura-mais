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

interface Produto {
  nome: string
  preco: string
}

interface CustoFixo {
  descricao: string
  valor: string
  tipo: 'fixo' | 'variavel'
  categoria: string
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
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-verde/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-verde" style={{ fontSize: '18px' }}>storefront</span>
        </div>
        <h2 className="section-title">A tua barbearia</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Nome da barbearia *</label>
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
          <label className="block text-sm font-medium text-ink mb-1.5">Número de barbeiros</label>
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
            <label className="block text-sm font-medium text-ink mb-1.5">Hora de abertura</label>
            <input
              type="time"
              value={data.hora_abertura}
              onChange={(e) => onChange('hora_abertura', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Hora de fecho</label>
            <input
              type="time"
              value={data.hora_fecho}
              onChange={(e) => onChange('hora_fecho', e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Dias de trabalho por mês</label>
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
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-verde/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-verde" style={{ fontSize: '18px' }}>content_cut</span>
        </div>
        <h2 className="section-title">Os teus serviços</h2>
      </div>

      <div className="space-y-3 mb-4">
        {servicos.map((s, i) => (
          <div key={i} className="rounded-xl bg-surface-secondary p-4 relative">
            {servicos.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="btn-ghost absolute top-2 right-2 !p-1 !h-auto"
                aria-label="Remover serviço"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink mb-1">Nome do serviço</label>
                <input
                  type="text"
                  value={s.nome}
                  onChange={(e) => onChange(i, 'nome', e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="Ex: Corte de cabelo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Preço (€)</label>
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
                <label className="block text-xs font-medium text-ink mb-1">Tempo (min)</label>
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
                <label className="block text-xs font-medium text-ink mb-1">Custo de material (€)</label>
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
        className="btn-secondary w-full flex items-center justify-center gap-1.5"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
        Adicionar serviço
      </button>
    </div>
  )
}

// ── Step 3: Produtos ─────────────────────────────────────────────
function Step3Produtos({
  produtos,
  onChange,
  onAdd,
  onRemove,
}: {
  produtos: Produto[]
  onChange: (index: number, field: keyof Produto, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-verde/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-verde" style={{ fontSize: '18px' }}>inventory_2</span>
        </div>
        <h2 className="section-title">Os teus produtos</h2>
      </div>
      <p className="text-xs text-ink-secondary mb-5">Ceras, after-shaves, óleos — produtos que vendes aos clientes. Podes adicionar mais depois.</p>

      <div className="space-y-3 mb-4">
        {produtos.map((p, i) => (
          <div key={i} className="rounded-xl bg-surface-secondary p-4 relative">
            {produtos.length > 1 && (
              <button type="button" onClick={() => onRemove(i)} className="btn-ghost absolute top-2 right-2 !p-1 !h-auto" aria-label="Remover produto">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink mb-1">Nome do produto</label>
                <input type="text" value={p.nome} onChange={e => onChange(i, 'nome', e.target.value)}
                  className="input-field text-sm py-2" placeholder="Ex: Cera de cabelo" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink mb-1">Preço (€)</label>
                <input type="number" value={p.preco} onChange={e => onChange(i, 'preco', e.target.value)}
                  className="input-field text-sm py-2" placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAdd} className="btn-secondary w-full flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
        Adicionar produto
      </button>
    </div>
  )
}

// ── Step 4: Custos Fixos ──────────────────────────────────────────
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
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-verde/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-verde" style={{ fontSize: '18px' }}>receipt_long</span>
        </div>
        <h2 className="section-title">Custos mensais</h2>
      </div>

      <div className="space-y-3 mb-4">
        {custos.map((c, i) => (
          <div key={i} className="rounded-xl bg-surface-secondary p-4 relative">
            {custos.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="btn-ghost absolute top-2 right-2 !p-1 !h-auto"
                aria-label="Remover custo"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink mb-1">Descrição</label>
                <input
                  type="text"
                  value={c.descricao}
                  onChange={(e) => onChange(i, 'descricao', e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="Ex: Renda do espaço"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Valor (€/mês)</label>
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
                <label className="block text-xs font-medium text-ink mb-1">Tipo</label>
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
                <label className="block text-xs font-medium text-ink mb-1">Categoria</label>
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
        className="btn-secondary w-full flex items-center justify-center gap-1.5"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
        Adicionar custo
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
  const [produtos, setProdutos] = useState<Produto[]>([
    { nome: '', preco: '' },
  ])

  // Step 4 data
  const [custos, setCustos] = useState<CustoFixo[]>([
    { descricao: '', valor: '', tipo: 'fixo', categoria: '' },
  ])

  const handleBarbeariaChange = (field: string, value: string) => {
    setBarbearia((prev) => ({ ...prev, [field]: value }))
  }

  const handleServicoChange = (i: number, field: keyof Servico, value: string) => {
    setServicos((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  }

  const handleProdutoChange = (i: number, field: keyof Produto, value: string) => {
    setProdutos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)))
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

      // Verificar se barbearia já existe para evitar duplicados
      const { data: existente } = await supabase
        .from('barbearias')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existente) {
        router.push('/dashboard')
        router.refresh()
        return
      }

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

      // Insert produtos válidos
      const produtosValidos = produtos.filter((p) => p.nome.trim())
      if (produtosValidos.length > 0) {
        await supabase.from('produtos').insert(
          produtosValidos.map((p) => ({
            barbearia_id,
            nome: p.nome.trim(),
            preco: parseFloat(p.preco) || 0,
            ativo: true,
          }))
        )
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

  const stepLabels = ['A tua barbearia', 'Os teus serviços', 'Os teus produtos', 'Custos mensais']

  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Image src="/images/Logo_F_.png" alt="Fatura+" width={56} height={56} className="mb-3" />
          <h1 className="font-serif font-bold text-3xl text-verde">
            Fatura<span className="text-dourado">+</span>
          </h1>
          <p className="text-ink-secondary text-sm mt-1 font-sans">Configura a tua barbearia em 4 passos</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {stepLabels.map((label, i) => (
              <span
                key={i}
                className={`text-xs font-medium font-sans ${i + 1 <= step ? 'text-verde' : 'text-ink-secondary'}`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="h-1 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-verde rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
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
          <Step3Produtos
            produtos={produtos}
            onChange={handleProdutoChange}
            onAdd={() => setProdutos((p) => [...p, { nome: '', preco: '' }])}
            onRemove={(i) => setProdutos((p) => p.filter((_, idx) => idx !== i))}
          />
        )}
        {step === 4 && (
          <Step3
            custos={custos}
            onChange={handleCustoChange}
            onAdd={() => setCustos((p) => [...p, { descricao: '', valor: '', tipo: 'fixo', categoria: '' }])}
            onRemove={(i) => setCustos((p) => p.filter((_, idx) => idx !== i))}
          />
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm mt-4 font-sans">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-surface-secondary">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="btn-ghost">
              Anterior
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button type="button" onClick={nextStep} className="btn-primary">
              Seguinte
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-dourado disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
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
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                  Concluir configuração
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-ink-secondary font-sans mt-5">
          Podes alterar estas configurações mais tarde nas definições
        </p>
      </div>
    </div>
  )
}
