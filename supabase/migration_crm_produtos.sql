-- ================================================================
-- Migration: CRM de Clientes + Produtos + Marcações Online
-- Executa este ficheiro no SQL Editor do teu projeto Supabase
-- ================================================================

-- ----------------------------------------------------------------
-- CLIENTES (CRM)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbearia_id  UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  telemovel     TEXT,
  observacoes   TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barbearia_id, telemovel)
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador gere os seus clientes" ON public.clientes
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_clientes_barbearia ON public.clientes(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telemovel ON public.clientes(barbearia_id, telemovel);

-- ----------------------------------------------------------------
-- PRODUTOS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produtos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbearia_id  UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  preco         NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo         BOOLEAN DEFAULT TRUE,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador gere os seus produtos" ON public.produtos
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_produtos_barbearia ON public.produtos(barbearia_id);

-- ----------------------------------------------------------------
-- Novas colunas em FATURAÇÃO
-- ----------------------------------------------------------------
ALTER TABLE public.faturacao
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (tipo IN ('servico', 'produto')) DEFAULT 'servico';

-- ----------------------------------------------------------------
-- Nova coluna em MARCAÇÕES
-- ----------------------------------------------------------------
ALTER TABLE public.marcacoes
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------
-- RLS para marcações online (acesso público)
-- ----------------------------------------------------------------

-- Permitir leitura pública de barbearias com marcações online ativas
CREATE POLICY "Público pode ver barbearias com marcações online" ON public.barbearias
  FOR SELECT USING (marcacoes_online = true);

-- Permitir leitura pública de serviços de barbearias com marcações online
CREATE POLICY "Público pode ver serviços para marcações online" ON public.servicos
  FOR SELECT USING (
    ativo = true AND barbearia_id IN (
      SELECT id FROM public.barbearias WHERE marcacoes_online = true
    )
  );

-- Permitir leitura pública de marcações para verificar disponibilidade
CREATE POLICY "Público pode ver marcações para disponibilidade" ON public.marcacoes
  FOR SELECT USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE marcacoes_online = true
    )
  );

-- Permitir inserção pública de marcações online
CREATE POLICY "Público pode criar marcações online" ON public.marcacoes
  FOR INSERT WITH CHECK (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE marcacoes_online = true
    )
  );
