'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const SMS_TEMPLATE_PADRAO =
  'Olá [nome_cliente]! Lembrete da tua marcação em [nome_barbearia] amanhã, [data] às [hora] para [nome_servico]. Até amanhã!'

const SMS_VARIAVEIS = ['[nome_cliente]', '[nome_barbearia]', '[data]', '[hora]', '[nome_servico]']

const CATEGORIAS_CUSTO = ['Rendas', 'Água/Luz/Gás', 'Internet/Telefone', 'Seguros', 'Contabilidade', 'Marketing', 'Software', 'Equipamento', 'Outro']

interface Produto {
  id: string
  nome: string
  preco: number
  ativo: boolean
}

interface Barbearia {
  id: string
  nome: string
  num_barbeiros: number | null
  hora_abertura: string | null
  hora_fecho: string | null
  dias_trabalho_mes: number | null
  sms_ativo: boolean | null
  sms_mensagem_personalizada: string | null
  marcacoes_online: boolean | null
  slug: string | null
}

interface Servico {
  id: string
  nome: string
  preco: number
  tempo_minutos: number
  custo_material: number
  ativo: boolean
}

interface CustoFixo {
  id: string
  descricao: string
  valor: number
  tipo: 'fixo' | 'variavel'
  categoria: string
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
  const [servicos, setServicos] = useState<Servico[]>([])
  const [custos, setCustos] = useState<CustoFixo[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  // Dados da barbearia (editáveis localmente)
  const [editBarbearia, setEditBarbearia] = useState({ nome: '', num_barbeiros: '', hora_abertura: '', hora_fecho: '', dias_trabalho_mes: '' })

  // SMS state
  const [smsAtivo, setSmsAtivo] = useState(true)
  const [smsMensagem, setSmsMensagem] = useState(SMS_TEMPLATE_PADRAO)
  const [testeNumero, setTesteNumero] = useState('')
  const [enviandoTeste, setEnviandoTeste] = useState(false)

  // Marcações online state
  const [marcacoesOnline, setMarcacoesOnline] = useState(false)

  // Novo serviço
  const [novoServico, setNovoServico] = useState({ nome: '', preco: '', tempo_minutos: '', custo_material: '' })
  const [adicionandoServico, setAdicionandoServico] = useState(false)

  // Novo custo
  const [novoCusto, setNovoCusto] = useState({ descricao: '', valor: '', tipo: 'fixo' as 'fixo' | 'variavel', categoria: 'Outro' })
  const [adicionandoCusto, setAdicionandoCusto] = useState(false)

  // Novo produto
  const [novoProduto, setNovoProduto] = useState({ nome: '', preco: '' })
  const [adicionandoProduto, setAdicionandoProduto] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const carregar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: barbId } = await supabase.from('barbearias').select('id').eq('user_id', user.id).single()
    const bid = barbId?.id ?? ''
    const [{ data: barb }, { data: servs }, { data: custs }, { data: prods }] = await Promise.all([
      supabase.from('barbearias').select('id, nome, num_barbeiros, hora_abertura, hora_fecho, dias_trabalho_mes, sms_ativo, sms_mensagem_personalizada, marcacoes_online, slug').eq('user_id', user.id).single(),
      supabase.from('servicos').select('id, nome, preco, tempo_minutos, custo_material, ativo').eq('barbearia_id', bid).order('criado_em'),
      supabase.from('custos_fixos').select('id, descricao, valor, tipo, categoria').eq('barbearia_id', bid).order('criado_em'),
      supabase.from('produtos').select('id, nome, preco, ativo').eq('barbearia_id', bid).order('criado_em'),
    ])

    if (barb) {
      setBarbearia(barb as Barbearia)
      setEditBarbearia({
        nome: barb.nome ?? '',
        num_barbeiros: String(barb.num_barbeiros ?? ''),
        hora_abertura: barb.hora_abertura ?? '09:00',
        hora_fecho: barb.hora_fecho ?? '19:00',
        dias_trabalho_mes: String(barb.dias_trabalho_mes ?? ''),
      })
      setSmsAtivo(barb.sms_ativo !== false)
      setSmsMensagem(barb.sms_mensagem_personalizada || SMS_TEMPLATE_PADRAO)
      setMarcacoesOnline(barb.marcacoes_online ?? false)
    }
    if (servs) setServicos(servs as Servico[])
    if (custs) setCustos(custs as CustoFixo[])
    if (prods) setProdutos(prods as Produto[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { carregar() }, [carregar])

  // ─── Barbearia ───────────────────────────────────────────────────
  const guardarBarbearia = async () => {
    if (!barbearia) return
    setSaving('barbearia')
    const { error } = await supabase.from('barbearias').update({
      nome: editBarbearia.nome.trim(),
      num_barbeiros: parseInt(editBarbearia.num_barbeiros) || 1,
      hora_abertura: editBarbearia.hora_abertura,
      hora_fecho: editBarbearia.hora_fecho,
      dias_trabalho_mes: parseInt(editBarbearia.dias_trabalho_mes) || 22,
    }).eq('id', barbearia.id)
    setSaving(null)
    if (error) showToast('Erro ao guardar. Tenta novamente.')
    else { showToast('Dados guardados ✓'); setBarbearia(b => b ? { ...b, ...editBarbearia, num_barbeiros: parseInt(editBarbearia.num_barbeiros) || 1, dias_trabalho_mes: parseInt(editBarbearia.dias_trabalho_mes) || 22 } : b) }
  }

  // ─── Serviços ───────────────────────────────────────────────────
  const adicionarServico = async () => {
    if (!barbearia || !novoServico.nome.trim()) return
    setAdicionandoServico(true)
    const { data, error } = await supabase.from('servicos').insert({
      barbearia_id: barbearia.id,
      nome: novoServico.nome.trim(),
      preco: parseFloat(novoServico.preco) || 0,
      tempo_minutos: parseInt(novoServico.tempo_minutos) || 30,
      custo_material: parseFloat(novoServico.custo_material) || 0,
      comissao_percentagem: 0,
      ativo: true,
    }).select().single()
    setAdicionandoServico(false)
    if (error) { showToast('Erro ao adicionar serviço.'); return }
    setServicos(prev => [...prev, data as Servico])
    setNovoServico({ nome: '', preco: '', tempo_minutos: '', custo_material: '' })
    showToast('Serviço adicionado ✓')
  }

  const atualizarServico = async (id: string, campo: string, valor: string | number | boolean) => {
    const { error } = await supabase.from('servicos').update({ [campo]: valor }).eq('id', id)
    if (error) { showToast('Erro ao atualizar serviço.'); return }
    setServicos(prev => prev.map(s => s.id === id ? { ...s, [campo]: valor } : s))
  }

  const removerServico = async (id: string) => {
    const { error } = await supabase.from('servicos').delete().eq('id', id)
    if (error) { showToast('Erro ao remover serviço.'); return }
    setServicos(prev => prev.filter(s => s.id !== id))
    showToast('Serviço removido ✓')
  }

  // ─── Custos fixos ───────────────────────────────────────────────
  const adicionarCusto = async () => {
    if (!barbearia || !novoCusto.descricao.trim()) return
    setAdicionandoCusto(true)
    const { data, error } = await supabase.from('custos_fixos').insert({
      barbearia_id: barbearia.id,
      descricao: novoCusto.descricao.trim(),
      valor: parseFloat(novoCusto.valor) || 0,
      tipo: novoCusto.tipo,
      categoria: novoCusto.categoria,
    }).select().single()
    setAdicionandoCusto(false)
    if (error) { showToast('Erro ao adicionar custo.'); return }
    setCustos(prev => [...prev, data as CustoFixo])
    setNovoCusto({ descricao: '', valor: '', tipo: 'fixo', categoria: 'Outro' })
    showToast('Custo adicionado ✓')
  }

  const atualizarCusto = async (id: string, campo: string, valor: string | number) => {
    const { error } = await supabase.from('custos_fixos').update({ [campo]: valor }).eq('id', id)
    if (error) { showToast('Erro ao atualizar custo.'); return }
    setCustos(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c))
  }

  const removerCusto = async (id: string) => {
    const { error } = await supabase.from('custos_fixos').delete().eq('id', id)
    if (error) { showToast('Erro ao remover custo.'); return }
    setCustos(prev => prev.filter(c => c.id !== id))
    showToast('Custo removido ✓')
  }

  // ─── Produtos ───────────────────────────────────────────────────
  const adicionarProduto = async () => {
    if (!barbearia || !novoProduto.nome.trim()) return
    setAdicionandoProduto(true)
    const { data, error } = await supabase.from('produtos').insert({
      barbearia_id: barbearia.id,
      nome: novoProduto.nome.trim(),
      preco: parseFloat(novoProduto.preco) || 0,
      ativo: true,
    }).select().single()
    setAdicionandoProduto(false)
    if (error) { showToast('Erro ao adicionar produto.'); return }
    setProdutos(prev => [...prev, data as Produto])
    setNovoProduto({ nome: '', preco: '' })
    showToast('Produto adicionado ✓')
  }

  const atualizarProduto = async (id: string, campo: string, valor: string | number | boolean) => {
    const { error } = await supabase.from('produtos').update({ [campo]: valor }).eq('id', id)
    if (error) { showToast('Erro ao atualizar produto.'); return }
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, [campo]: valor } : p))
  }

  const removerProduto = async (id: string) => {
    const { error } = await supabase.from('produtos').delete().eq('id', id)
    if (error) { showToast('Erro ao remover produto.'); return }
    setProdutos(prev => prev.filter(p => p.id !== id))
    showToast('Produto removido ✓')
  }

  // ─── SMS ────────────────────────────────────────────────────────
  const handleSmsAtivoToggle = async (val: boolean) => {
    if (!barbearia) return
    setSmsAtivo(val)
    setSaving('sms_ativo')
    await supabase.from('barbearias').update({ sms_ativo: val }).eq('id', barbearia.id)
    setSaving(null)
    showToast('Guardado ✓')
  }

  const handleMensagemGuardar = async () => {
    if (!barbearia) return
    setSaving('sms_mensagem')
    await supabase.from('barbearias').update({ sms_mensagem_personalizada: smsMensagem.trim() || null }).eq('id', barbearia.id)
    setSaving(null)
    showToast('Mensagem guardada ✓')
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
      else showToast(`Erro SMS: ${data.erro || 'Twilio não configurado'}`)
    } catch {
      showToast('Erro ao enviar SMS de teste')
    } finally {
      setEnviandoTeste(false)
    }
  }

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
        {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-48 bg-gray-200 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0e4324]">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gere as preferências da tua barbearia</p>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#0e4324] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
          {toast}
        </div>
      )}

      {/* ─── Dados da barbearia ─────────────────────────────────── */}
      <Section title="Dados da barbearia" description="Informações gerais do teu negócio">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nome da barbearia</label>
          <input
            type="text"
            value={editBarbearia.nome}
            onChange={e => setEditBarbearia(p => ({ ...p, nome: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nº de barbeiros</label>
            <input
              type="number"
              value={editBarbearia.num_barbeiros}
              onChange={e => setEditBarbearia(p => ({ ...p, num_barbeiros: e.target.value }))}
              min="1"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dias de trabalho/mês</label>
            <input
              type="number"
              value={editBarbearia.dias_trabalho_mes}
              onChange={e => setEditBarbearia(p => ({ ...p, dias_trabalho_mes: e.target.value }))}
              min="1" max="31"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hora de abertura</label>
            <input
              type="time"
              value={editBarbearia.hora_abertura}
              onChange={e => setEditBarbearia(p => ({ ...p, hora_abertura: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hora de fecho</label>
            <input
              type="time"
              value={editBarbearia.hora_fecho}
              onChange={e => setEditBarbearia(p => ({ ...p, hora_fecho: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={guardarBarbearia}
            disabled={saving === 'barbearia'}
            className="text-sm bg-[#0e4324] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#0a3019] disabled:opacity-50 transition-colors"
          >
            {saving === 'barbearia' ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </Section>

      {/* ─── Serviços ────────────────────────────────────────────── */}
      <Section title="Serviços" description="Gere os serviços disponíveis na tua barbearia">
        <div className="space-y-2">
          {servicos.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum serviço adicionado ainda.</p>
          )}
          {servicos.map(s => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={s.nome}
                  onBlur={e => { if (e.target.value !== s.nome) atualizarServico(s.id, 'nome', e.target.value) }}
                  className="flex-1 text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#0e4324] transition-colors"
                />
                <button
                  onClick={() => removerServico(s.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Remover serviço"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Preço (€)</label>
                  <input
                    type="number"
                    defaultValue={s.preco}
                    onBlur={e => { const v = parseFloat(e.target.value); if (v !== s.preco) atualizarServico(s.id, 'preco', v) }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
                    min="0" step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Tempo (min)</label>
                  <input
                    type="number"
                    defaultValue={s.tempo_minutos}
                    onBlur={e => { const v = parseInt(e.target.value); if (v !== s.tempo_minutos) atualizarServico(s.id, 'tempo_minutos', v) }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Mat. (€)</label>
                  <input
                    type="number"
                    defaultValue={s.custo_material}
                    onBlur={e => { const v = parseFloat(e.target.value); if (v !== s.custo_material) atualizarServico(s.id, 'custo_material', v) }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
                    min="0" step="0.01"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Adicionar novo serviço */}
        <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500">Novo serviço</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nome do serviço"
              value={novoServico.nome}
              onChange={e => setNovoServico(p => ({ ...p, nome: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            />
            <input
              type="number"
              placeholder="Preço (€)"
              value={novoServico.preco}
              onChange={e => setNovoServico(p => ({ ...p, preco: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
              min="0" step="0.01"
            />
            <input
              type="number"
              placeholder="Tempo (min)"
              value={novoServico.tempo_minutos}
              onChange={e => setNovoServico(p => ({ ...p, tempo_minutos: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
              min="1"
            />
            <input
              type="number"
              placeholder="Custo material (€)"
              value={novoServico.custo_material}
              onChange={e => setNovoServico(p => ({ ...p, custo_material: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
              min="0" step="0.01"
            />
          </div>
          <button
            onClick={adicionarServico}
            disabled={adicionandoServico || !novoServico.nome.trim()}
            className="w-full text-sm bg-[#0e4324]/10 text-[#0e4324] hover:bg-[#0e4324]/20 px-3 py-2 rounded-lg font-medium disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            {adicionandoServico ? 'A adicionar...' : 'Adicionar serviço'}
          </button>
        </div>
      </Section>

      {/* ─── Custos fixos ───────────────────────────────────────── */}
      <Section title="Custos mensais" description="Gere os custos fixos e variáveis da tua barbearia">
        <div className="space-y-2">
          {custos.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum custo adicionado ainda.</p>
          )}
          {custos.map(c => (
            <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  defaultValue={c.descricao}
                  onBlur={e => { if (e.target.value !== c.descricao) atualizarCusto(c.id, 'descricao', e.target.value) }}
                  className="text-sm font-medium text-gray-800 bg-transparent w-full focus:outline-none focus:bg-white focus:border focus:border-gray-200 focus:rounded px-1"
                />
                <div className="flex gap-3 mt-1 items-center">
                  <span className="text-xs text-gray-400">
                    €<input
                      type="number"
                      defaultValue={c.valor}
                      onBlur={e => { const v = parseFloat(e.target.value); if (v !== c.valor) atualizarCusto(c.id, 'valor', v) }}
                      className="w-16 bg-transparent focus:outline-none focus:bg-white focus:border focus:border-gray-200 focus:rounded px-1"
                      min="0" step="0.01"
                    />/mês
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${c.tipo === 'fixo' ? 'bg-[#0e4324]/10 text-[#0e4324]' : 'bg-amber-50 text-amber-700'}`}>
                    {c.tipo}
                  </span>
                  <span className="text-xs text-gray-400">{c.categoria}</span>
                </div>
              </div>
              <button
                onClick={() => removerCusto(c.id)}
                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                title="Remover custo"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar novo custo */}
        <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500">Novo custo</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Descrição"
              value={novoCusto.descricao}
              onChange={e => setNovoCusto(p => ({ ...p, descricao: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            />
            <input
              type="number"
              placeholder="Valor (€/mês)"
              value={novoCusto.valor}
              onChange={e => setNovoCusto(p => ({ ...p, valor: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
              min="0" step="0.01"
            />
            <select
              value={novoCusto.tipo}
              onChange={e => setNovoCusto(p => ({ ...p, tipo: e.target.value as 'fixo' | 'variavel' }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            >
              <option value="fixo">Fixo</option>
              <option value="variavel">Variável</option>
            </select>
            <select
              value={novoCusto.categoria}
              onChange={e => setNovoCusto(p => ({ ...p, categoria: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            >
              {CATEGORIAS_CUSTO.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <button
            onClick={adicionarCusto}
            disabled={adicionandoCusto || !novoCusto.descricao.trim()}
            className="w-full text-sm bg-[#0e4324]/10 text-[#0e4324] hover:bg-[#0e4324]/20 px-3 py-2 rounded-lg font-medium disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            {adicionandoCusto ? 'A adicionar...' : 'Adicionar custo'}
          </button>
        </div>
      </Section>

      {/* ─── Produtos ───────────────────────────────────────────── */}
      <Section title="Produtos" description="Artigos à venda na tua barbearia (ceras, after shaves, etc.)">
        <div className="space-y-2">
          {produtos.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum produto adicionado ainda.</p>
          )}
          {produtos.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <input
                type="text"
                defaultValue={p.nome}
                onBlur={e => { if (e.target.value !== p.nome) atualizarProduto(p.id, 'nome', e.target.value) }}
                className="flex-1 text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#0e4324] transition-colors"
              />
              <div>
                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Preço (€)</label>
                <input
                  type="number"
                  defaultValue={p.preco}
                  onBlur={e => { const v = parseFloat(e.target.value); if (v !== p.preco) atualizarProduto(p.id, 'preco', v) }}
                  className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
                  min="0" step="0.01"
                />
              </div>
              <button
                onClick={() => removerProduto(p.id)}
                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                title="Remover produto"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar novo produto */}
        <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500">Novo produto</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nome do produto"
              value={novoProduto.nome}
              onChange={e => setNovoProduto(p => ({ ...p, nome: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
            />
            <input
              type="number"
              placeholder="Preço (€)"
              value={novoProduto.preco}
              onChange={e => setNovoProduto(p => ({ ...p, preco: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0e4324] transition-colors"
              min="0" step="0.01"
            />
          </div>
          <button
            onClick={adicionarProduto}
            disabled={adicionandoProduto || !novoProduto.nome.trim()}
            className="w-full text-sm bg-[#0e4324]/10 text-[#0e4324] hover:bg-[#0e4324]/20 px-3 py-2 rounded-lg font-medium disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            {adicionandoProduto ? 'A adicionar...' : 'Adicionar produto'}
          </button>
        </div>
      </Section>

      {/* ─── SMS ────────────────────────────────────────────────── */}
      <Section title="Notificações SMS" description="Lembretes automáticos para os teus clientes">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Ativar lembretes SMS</p>
            <p className="text-xs text-gray-400 mt-0.5">Envia SMS automáticos 24h antes de cada marcação</p>
          </div>
          <Toggle value={smsAtivo} onChange={handleSmsAtivoToggle} disabled={saving === 'sms_ativo'} />
        </div>

        {smsAtivo && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-800">Mensagem personalizada</p>
                <button onClick={() => setSmsMensagem(SMS_TEMPLATE_PADRAO)} className="text-xs text-gray-400 hover:text-[#977c30] transition-colors">
                  Repor padrão
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SMS_VARIAVEIS.map(v => (
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
                  disabled={saving === 'sms_mensagem'}
                  className="text-xs bg-[#0e4324] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#0a3019] disabled:opacity-50 transition-colors"
                >
                  {saving === 'sms_mensagem' ? 'A guardar...' : 'Guardar mensagem'}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium mb-2">PREVIEW</p>
              <p className="text-xs text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-xl p-3">{previewMensagem}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800 mb-1">Enviar SMS de teste</p>
              <p className="text-xs text-gray-400 mb-3">Só funciona quando o Twilio estiver configurado</p>
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
                  {enviandoTeste ? 'A enviar...' : 'Enviar teste'}
                </button>
              </div>
            </div>
          </>
        )}
      </Section>

      {/* ─── Marcações online ───────────────────────────────────── */}
      <Section title="Marcações online" description="Permite que os clientes agendem pelo link público">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Permitir marcações online</p>
            <p className="text-xs text-gray-400 mt-0.5">Os clientes podem agendar sem precisar de ligar</p>
          </div>
          <Toggle value={marcacoesOnline} onChange={handleMarcacoesOnlineToggle} disabled={saving === 'marcacoes_online'} />
        </div>

        {marcacoesOnline && barbearia?.slug && (
          <div className="bg-[#f0f7f3] rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-2">LINK PÚBLICO</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-[#0e4324] font-mono flex-1 truncate">fatura-mais.pt/agendar/{barbearia.slug}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(`https://fatura-mais.pt/agendar/${barbearia.slug}`); showToast('Link copiado ✓') }}
                className="text-xs bg-[#0e4324] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#0a3019] transition-colors whitespace-nowrap"
              >
                Copiar
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}
