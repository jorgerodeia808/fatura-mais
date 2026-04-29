'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getNichoConfig } from '@/lib/nicho'

// ── FP+ Onboarding ─────────────────────────────────────────────────
const FP_BG = '#1e3a5f'
const FP_ACCENT = '#c9a84c'

function OnboardingFP() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const check = await fetch('/api/verificar-convite')
      const { autorizado } = await check.json()
      if (!autorizado) throw new Error('Não tens acesso a esta plataforma.')

      const { error: err } = await supabase
        .from('fp_perfis')
        .upsert({ user_id: user.id, plano: 'trial' }, { onConflict: 'user_id', ignoreDuplicates: true })

      if (err) throw err
      router.push('/dashboard')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao configurar perfil.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: FP_BG }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4"
            style={{ background: FP_ACCENT, color: FP_BG }}
          >
            FP
          </div>
          <h1 className="font-bold text-3xl text-white">
            Finanças Pessoais<span style={{ color: FP_ACCENT }}>+</span>
          </h1>
          <p className="text-white/60 text-sm mt-2">Toma o controlo da tua vida financeira</p>
        </div>

        <div className="bg-white rounded-2xl p-8">
          <h2 className="font-bold text-xl text-gray-900 mb-2">Bem-vindo ao FP+</h2>
          <p className="text-sm text-gray-500 mb-6">
            A plataforma para organizares as tuas finanças pessoais. Tudo num só sítio.
          </p>

          <div className="space-y-3 mb-8">
            {[
              { icon: 'swap_vert',    text: 'Regista rendimentos e despesas' },
              { icon: 'autorenew',   text: 'Gere pagamentos recorrentes' },
              { icon: 'pie_chart',   text: 'Define orçamentos por categoria' },
              { icon: 'flag',        text: 'Acompanha os teus objetivos de poupança' },
            ].map(item => (
              <div key={item.icon} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${FP_BG}12` }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: FP_BG }}>{item.icon}</span>
                </div>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: FP_BG, color: 'white' }}
          >
            {loading ? 'A configurar...' : 'Começar agora →'}
          </button>
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          Período de trial gratuito · Sem cartão de crédito
        </p>
      </div>
    </div>
  )
}

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

// Cor escura por nicho (para botões, destaques, barra de progresso)
const primaryColor: Record<string, string> = {
  barbeiro: '#2d2d2d',
  nails:    '#DB2777',
  lash:     '#3b0764',
  tatuador: '#111827',
}

// Exemplos de placeholder por nicho
const nichoExemplos: Record<string, {
  nomeNegocio: string
  servico: string
  produto: string
  descProdutos: string
}> = {
  barbeiro: {
    nomeNegocio: 'Barbearia do João',
    servico: 'Corte de cabelo',
    produto: 'Cera de cabelo',
    descProdutos: 'Ceras, after-shaves, óleos — produtos que vendes aos clientes. Podes adicionar mais depois.',
  },
  nails: {
    nomeNegocio: 'Estúdio da Ana',
    servico: 'Manicure gel',
    produto: 'Verniz de gel',
    descProdutos: 'Vernizes, géis, acrílicos — produtos que vendes às clientes. Podes adicionar mais depois.',
  },
  lash: {
    nomeNegocio: 'Estúdio da Sofia',
    servico: 'Lifting de pestanas',
    produto: 'Soro de pestanas',
    descProdutos: 'Soros, máscaras, adesivos — produtos que vendes às clientes. Podes adicionar mais depois.',
  },
  tatuador: {
    nomeNegocio: 'Estúdio do Miguel',
    servico: 'Tatuagem pequena',
    produto: 'Creme cicatrizante',
    descProdutos: 'Cremes, tintas, kits de cuidado pós-tattoo — produtos que vendes aos clientes. Podes adicionar mais depois.',
  },
}

// ── Step 1: Negócio ───────────────────────────────────────────────
function Step1({
  data,
  onChange,
  primary,
  nomeNegocio,
  nomePlural,
  exemploNome,
}: {
  data: { nome: string; num_barbeiros: string; hora_abertura: string; hora_fecho: string; dias_trabalho_mes: string }
  onChange: (field: string, value: string) => void
  primary: string
  nomeNegocio: string
  nomePlural: string
  exemploNome: string
}) {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primary}18` }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: primary }}>storefront</span>
        </div>
        <h2 className="section-title">O teu {nomeNegocio}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Nome do {nomeNegocio} *</label>
          <input
            type="text"
            value={data.nome}
            onChange={(e) => onChange('nome', e.target.value)}
            className="input-field"
            placeholder={`Ex: ${exemploNome}`}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Número de {nomePlural}</label>
          <input
            type="number"
            value={data.num_barbeiros}
            onChange={(e) => onChange('num_barbeiros', e.target.value)}
            className="input-field"
            placeholder="Ex: 1"
            min="1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Hora de abertura</label>
            <input type="time" value={data.hora_abertura} onChange={(e) => onChange('hora_abertura', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Hora de fecho</label>
            <input type="time" value={data.hora_fecho} onChange={(e) => onChange('hora_fecho', e.target.value)} className="input-field" />
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
  primary,
  exemploServico,
}: {
  servicos: Servico[]
  onChange: (index: number, field: keyof Servico, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  primary: string
  exemploServico: string
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primary}18` }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: primary }}>spa</span>
        </div>
        <h2 className="section-title">Os teus serviços</h2>
      </div>

      <div className="space-y-3 mb-4">
        {servicos.map((s, i) => (
          <div key={i} className="rounded-xl bg-surface-secondary p-4 relative">
            {servicos.length > 1 && (
              <button type="button" onClick={() => onRemove(i)} className="btn-ghost absolute top-2 right-2 !p-1 !h-auto" aria-label="Remover serviço">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink mb-1">Nome do serviço</label>
                <input type="text" value={s.nome} onChange={(e) => onChange(i, 'nome', e.target.value)}
                  className="input-field text-sm py-2" placeholder={`Ex: ${exemploServico}`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Preço (€)</label>
                <input type="number" value={s.preco} onChange={(e) => onChange(i, 'preco', e.target.value)}
                  className="input-field text-sm py-2" placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Tempo (min)</label>
                <input type="number" value={s.tempo_minutos} onChange={(e) => onChange(i, 'tempo_minutos', e.target.value)}
                  className="input-field text-sm py-2" placeholder="30" min="1" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink mb-1">Custo de material (€)</label>
                <input type="number" value={s.custo_material} onChange={(e) => onChange(i, 'custo_material', e.target.value)}
                  className="input-field text-sm py-2" placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAdd} className="btn-secondary w-full flex items-center justify-center gap-1.5">
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
  primary,
  exemploProduto,
  descProdutos,
}: {
  produtos: Produto[]
  onChange: (index: number, field: keyof Produto, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  primary: string
  exemploProduto: string
  descProdutos: string
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primary}18` }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: primary }}>inventory_2</span>
        </div>
        <h2 className="section-title">Os teus produtos</h2>
      </div>
      <p className="text-xs text-ink-secondary mb-5">{descProdutos}</p>

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
                  className="input-field text-sm py-2" placeholder={`Ex: ${exemploProduto}`} />
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
function Step4({
  custos,
  onChange,
  onAdd,
  onRemove,
  primary,
}: {
  custos: CustoFixo[]
  onChange: (index: number, field: keyof CustoFixo, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  primary: string
}) {
  const categorias = ['Rendas', 'Água/Luz/Gás', 'Internet/Telefone', 'Seguros', 'Contabilidade', 'Marketing', 'Software', 'Equipamento', 'Outro']

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primary}18` }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: primary }}>receipt_long</span>
        </div>
        <h2 className="section-title">Custos mensais</h2>
      </div>

      <div className="space-y-3 mb-4">
        {custos.map((c, i) => (
          <div key={i} className="rounded-xl bg-surface-secondary p-4 relative">
            {custos.length > 1 && (
              <button type="button" onClick={() => onRemove(i)} className="btn-ghost absolute top-2 right-2 !p-1 !h-auto" aria-label="Remover custo">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink mb-1">Descrição</label>
                <input type="text" value={c.descricao} onChange={(e) => onChange(i, 'descricao', e.target.value)}
                  className="input-field text-sm py-2" placeholder="Ex: Renda do espaço" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Valor (€/mês)</label>
                <input type="number" value={c.valor} onChange={(e) => onChange(i, 'valor', e.target.value)}
                  className="input-field text-sm py-2" placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Tipo</label>
                <select value={c.tipo} onChange={(e) => onChange(i, 'tipo', e.target.value as 'fixo' | 'variavel')} className="input-field text-sm py-2">
                  <option value="fixo">Fixo</option>
                  <option value="variavel">Variável</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink mb-1">Categoria</label>
                <select value={c.categoria} onChange={(e) => onChange(i, 'categoria', e.target.value)} className="input-field text-sm py-2">
                  <option value="">Seleciona...</option>
                  {categorias.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAdd} className="btn-secondary w-full flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
        Adicionar custo
      </button>
    </div>
  )
}

// ── Nicho Onboarding Page ─────────────────────────────────────────
function NichoOnboarding() {
  const router = useRouter()
  const supabase = createClient()
  const nicho = getNichoConfig()
  const primary = primaryColor[nicho.id] ?? '#0e4324'
  const exemplos = nichoExemplos[nicho.id] ?? nichoExemplos.barbeiro

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [negocio, setNegocio] = useState({
    nome: '',
    num_barbeiros: '',
    hora_abertura: '09:00',
    hora_fecho: '19:00',
    dias_trabalho_mes: '22',
  })

  const [servicos, setServicos] = useState<Servico[]>([
    { nome: '', preco: '', tempo_minutos: '', custo_material: '' },
  ])

  const [produtos, setProdutos] = useState<Produto[]>([
    { nome: '', preco: '' },
  ])

  const [custos, setCustos] = useState<CustoFixo[]>([
    { descricao: '', valor: '', tipo: 'fixo', categoria: '' },
  ])

  const nextStep = () => {
    if (step === 1 && !negocio.nome.trim()) {
      setError(`Por favor, introduz o nome do ${nicho.nomeNegocio}.`)
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

      const check = await fetch('/api/verificar-convite')
      const { autorizado } = await check.json()
      if (!autorizado) throw new Error('Não tens acesso a esta plataforma.')

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

      const { data: barb, error: barbErr } = await supabase
        .from('barbearias')
        .insert({
          user_id: user.id,
          nome: negocio.nome.trim(),
          num_barbeiros: parseInt(negocio.num_barbeiros) || 1,
          hora_abertura: negocio.hora_abertura,
          hora_fecho: negocio.hora_fecho,
          dias_trabalho_mes: parseInt(negocio.dias_trabalho_mes) || 22,
          plano: 'suspenso',
          nicho: process.env.NEXT_PUBLIC_NICHO ?? 'barbeiro',
        })
        .select()
        .single()

      if (barbErr) throw barbErr

      const barbearia_id = barb.id

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

      router.push('/bem-vindo')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar configuração.')
      setLoading(false)
    }
  }

  const stepLabels = [
    `O teu ${nicho.nomeNegocio}`,
    'Os teus serviços',
    'Os teus produtos',
    'Custos mensais',
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: nicho.corFundo }}>
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl mb-3"
            style={{ backgroundColor: primary, color: nicho.corDestaque === '#ffffff' ? nicho.cor : nicho.corDestaque }}
          >
            {nicho.letraLogo}+
          </div>
          <h1 className="font-serif font-bold text-3xl" style={{ color: primary }}>
            {nicho.nome}
          </h1>
          <p className="text-ink-secondary text-sm mt-1 font-sans">
            Configura o teu {nicho.nomeNegocio} em 4 passos
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {stepLabels.map((label, i) => (
              <span key={i} className="text-xs font-medium font-sans" style={{ color: i + 1 <= step ? primary : '#717971' }}>
                {label}
              </span>
            ))}
          </div>
          <div className="h-1 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%`, backgroundColor: primary }}
            />
          </div>
        </div>

        {/* Step content */}
        {step === 1 && (
          <Step1
            data={negocio}
            onChange={(f, v) => setNegocio(p => ({ ...p, [f]: v }))}
            primary={primary}
            nomeNegocio={nicho.nomeNegocio}
            nomePlural={nicho.nomePlural}
            exemploNome={exemplos.nomeNegocio}
          />
        )}
        {step === 2 && (
          <Step2
            servicos={servicos}
            onChange={(i, f, v) => setServicos(p => p.map((s, idx) => idx === i ? { ...s, [f]: v } : s))}
            onAdd={() => setServicos(p => [...p, { nome: '', preco: '', tempo_minutos: '', custo_material: '' }])}
            onRemove={(i) => setServicos(p => p.filter((_, idx) => idx !== i))}
            primary={primary}
            exemploServico={exemplos.servico}
          />
        )}
        {step === 3 && (
          <Step3Produtos
            produtos={produtos}
            onChange={(i, f, v) => setProdutos(p => p.map((pr, idx) => idx === i ? { ...pr, [f]: v } : pr))}
            onAdd={() => setProdutos(p => [...p, { nome: '', preco: '' }])}
            onRemove={(i) => setProdutos(p => p.filter((_, idx) => idx !== i))}
            primary={primary}
            exemploProduto={exemplos.produto}
            descProdutos={exemplos.descProdutos}
          />
        )}
        {step === 4 && (
          <Step4
            custos={custos}
            onChange={(i, f, v) => setCustos(p => p.map((c, idx) => idx === i ? { ...c, [f]: v } : c))}
            onAdd={() => setCustos(p => [...p, { descricao: '', valor: '', tipo: 'fixo', categoria: '' }])}
            onRemove={(i) => setCustos(p => p.filter((_, idx) => idx !== i))}
            primary={primary}
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
            <button type="button" onClick={prevStep} className="btn-ghost">Anterior</button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: primary }}
            >
              Seguinte
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: primary }}
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

export default function OnboardingPage() {
  if (process.env.NEXT_PUBLIC_APP_TYPE === 'fp') return <OnboardingFP />
  return <NichoOnboarding />
}
