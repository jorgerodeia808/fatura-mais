-- ================================================================
-- Fatura+ — RLS Policies completas
-- Executa este ficheiro no SQL Editor do Supabase
-- ================================================================

-- ── BARBEARIAS ────────────────────────────────────────────────────
ALTER TABLE public.barbearias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilizador vê a sua barbearia" ON public.barbearias;
CREATE POLICY "Utilizador vê a sua barbearia" ON public.barbearias
  FOR ALL USING (auth.uid() = user_id);

-- ── BARBEIROS ────────────────────────────────────────────────────
ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilizador gere os seus barbeiros" ON public.barbeiros;
CREATE POLICY "Utilizador gere os seus barbeiros" ON public.barbeiros
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

-- ── SERVIÇOS ─────────────────────────────────────────────────────
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilizador gere os seus serviços" ON public.servicos;
CREATE POLICY "Utilizador gere os seus serviços" ON public.servicos
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

-- ── CUSTOS FIXOS ─────────────────────────────────────────────────
ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilizador gere os seus custos fixos" ON public.custos_fixos;
CREATE POLICY "Utilizador gere os seus custos fixos" ON public.custos_fixos
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

-- ── FATURAÇÃO ────────────────────────────────────────────────────
ALTER TABLE public.faturacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilizador gere a sua faturação" ON public.faturacao;
CREATE POLICY "Utilizador gere a sua faturação" ON public.faturacao
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

-- ── DESPESAS ─────────────────────────────────────────────────────
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilizador gere as suas despesas" ON public.despesas;
CREATE POLICY "Utilizador gere as suas despesas" ON public.despesas
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

-- ── MARCAÇÕES ────────────────────────────────────────────────────
ALTER TABLE public.marcacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilizador gere as suas marcações" ON public.marcacoes;
CREATE POLICY "Utilizador gere as suas marcações" ON public.marcacoes
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );
