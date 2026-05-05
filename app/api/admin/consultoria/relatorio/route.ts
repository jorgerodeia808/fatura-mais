import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'jorgerodeia808@gmail.com')
    .split(',').map(e => e.trim().toLowerCase())

  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const tipo = searchParams.get('tipo')
  const data_inicio = searchParams.get('data_inicio')
  const data_fim = searchParams.get('data_fim')

  if (!user_id || !tipo || !data_inicio || !data_fim) {
    return NextResponse.json({ error: 'Parâmetros em falta' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (tipo === 'fp') {
    const [transRes, orcRes, objRes, recRes, perfRes] = await Promise.all([
      supabase
        .from('fp_transacoes')
        .select('id, descricao, valor, tipo, data, categoria_id, fp_categorias(nome, cor, icone)')
        .eq('user_id', user_id)
        .gte('data', data_inicio)
        .lte('data', data_fim)
        .order('data', { ascending: false }),
      supabase
        .from('fp_orcamentos')
        .select('id, categoria_id, valor_limite, mes, fp_categorias(nome, cor)')
        .eq('user_id', user_id),
      supabase
        .from('fp_objetivos')
        .select('id, nome, valor_objetivo, valor_atual, data_limite, ativo, criado_em')
        .eq('user_id', user_id)
        .eq('ativo', true),
      supabase
        .from('fp_recorrentes')
        .select('id, descricao, valor, tipo, dia_do_mes, ativo, fp_categorias(nome, cor)')
        .eq('user_id', user_id)
        .eq('ativo', true),
      supabase
        .from('fp_perfis')
        .select('plano, criado_em, subscricao_renovacao')
        .eq('user_id', user_id)
        .maybeSingle(),
    ])

    return NextResponse.json({
      tipo: 'fp',
      transacoes: transRes.data ?? [],
      orcamentos: orcRes.data ?? [],
      objetivos: objRes.data ?? [],
      recorrentes: recRes.data ?? [],
      perfil: perfRes.data,
    })
  }

  if (tipo === 'nicho') {
    const { data: barbearia } = await supabase
      .from('barbearias')
      .select('id, nome, nicho, plano, criado_em, num_barbeiros')
      .eq('user_id', user_id)
      .maybeSingle()

    if (!barbearia) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })
    }

    const barbearia_id = barbearia.id

    const [fatRes, desRes, marcRes] = await Promise.all([
      supabase
        .from('faturacao')
        .select('id, valor, gorjeta, tipo, estado, data_hora, servicos(nome), produtos(nome)')
        .eq('barbearia_id', barbearia_id)
        .gte('data_hora', `${data_inicio}T00:00:00`)
        .lte('data_hora', `${data_fim}T23:59:59`),
      supabase
        .from('despesas')
        .select('id, descricao, valor, categoria, tipo, data')
        .eq('barbearia_id', barbearia_id)
        .gte('data', data_inicio)
        .lte('data', data_fim),
      supabase
        .from('marcacoes')
        .select('id, estado, data_hora')
        .eq('barbearia_id', barbearia_id)
        .gte('data_hora', `${data_inicio}T00:00:00`)
        .lte('data_hora', `${data_fim}T23:59:59`),
    ])

    return NextResponse.json({
      tipo: 'nicho',
      barbearia,
      faturacao: fatRes.data ?? [],
      despesas: desRes.data ?? [],
      marcacoes: marcRes.data ?? [],
    })
  }

  return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
}
