-- ================================================================
-- Fatura+ — Schema SQL
-- Executa este ficheiro no SQL Editor do teu projeto Supabase
-- ================================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------
-- BARBEARIAS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.barbearias (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome              TEXT NOT NULL,
  num_barbeiros     INTEGER DEFAULT 1,
  hora_abertura     TIME DEFAULT '09:00',
  hora_fecho        TIME DEFAULT '19:00',
  dias_trabalho_mes INTEGER DEFAULT 22,
  criado_em         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.barbearias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador vê a sua barbearia" ON public.barbearias
  FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- BARBEIROS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.barbeiros (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbearia_id  UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  ativo         BOOLEAN DEFAULT TRUE,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador gere os seus barbeiros" ON public.barbeiros
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- SERVIÇOS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.servicos (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbearia_id          UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  nome                  TEXT NOT NULL,
  preco                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  tempo_minutos         INTEGER NOT NULL DEFAULT 30,
  custo_material        NUMERIC(10,2) DEFAULT 0,
  comissao_percentagem  NUMERIC(5,2) DEFAULT 0,
  ativo                 BOOLEAN DEFAULT TRUE,
  criado_em             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador gere os seus serviços" ON public.servicos
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- CUSTOS FIXOS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custos_fixos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbearia_id  UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  descricao     TEXT NOT NULL,
  valor         NUMERIC(10,2) NOT NULL DEFAULT 0,
  tipo          TEXT NOT NULL CHECK (tipo IN ('fixo', 'variavel')) DEFAULT 'fixo',
  categoria     TEXT DEFAULT 'Outro',
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador gere os seus custos fixos" ON public.custos_fixos
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- FATURAÇÃO
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faturacao (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbearia_id  UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  cliente_nome  TEXT,
  servico_id    UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
  valor         NUMERIC(10,2) NOT NULL DEFAULT 0,
  gorjeta       NUMERIC(10,2) DEFAULT 0,
  estado        TEXT NOT NULL CHECK (estado IN ('concluido', 'pendente', 'desistencia')) DEFAULT 'concluido',
  data_hora     TIMESTAMPTZ DEFAULT NOW(),
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faturacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador gere a sua faturação" ON public.faturacao
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- DESPESAS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.despesas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbearia_id  UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  descricao     TEXT NOT NULL,
  valor         NUMERIC(10,2) NOT NULL DEFAULT 0,
  categoria     TEXT DEFAULT 'Outro',
  tipo          TEXT NOT NULL CHECK (tipo IN ('fixo', 'variavel')) DEFAULT 'variavel',
  data          DATE DEFAULT CURRENT_DATE,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador gere as suas despesas" ON public.despesas
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- MARCAÇÕES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marcacoes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbearia_id      UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  cliente_nome      TEXT NOT NULL,
  cliente_telemovel TEXT,
  servico_id        UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
  data_hora         TIMESTAMPTZ NOT NULL,
  estado            TEXT NOT NULL CHECK (estado IN ('pendente', 'confirmado', 'desistencia')) DEFAULT 'pendente',
  sms_enviado       BOOLEAN DEFAULT FALSE,
  criado_em         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marcacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador gere as suas marcações" ON public.marcacoes
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

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

-- ================================================================
-- ÍNDICES para melhor performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_faturacao_barbearia_data ON public.faturacao(barbearia_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_despesas_barbearia_data ON public.despesas(barbearia_id, data);
CREATE INDEX IF NOT EXISTS idx_marcacoes_barbearia_data ON public.marcacoes(barbearia_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_servicos_barbearia ON public.servicos(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_barbeiros_barbearia ON public.barbeiros(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_clientes_barbearia ON public.clientes(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telemovel ON public.clientes(barbearia_id, telemovel);
CREATE INDEX IF NOT EXISTS idx_produtos_barbearia ON public.produtos(barbearia_id);
