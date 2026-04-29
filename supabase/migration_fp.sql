-- ─── Finanças Pessoais+ ───────────────────────────────────────────────────────

-- Perfil FP por utilizador (plano + ligação opcional ao nicho)
CREATE TABLE IF NOT EXISTS fp_perfis (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plano                 TEXT NOT NULL DEFAULT 'trial',
  subscricao_renovacao  TIMESTAMPTZ,
  criado_em             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Categorias (user_id NULL = categoria padrão do sistema)
CREATE TABLE IF NOT EXISTS fp_categorias (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome      TEXT NOT NULL,
  tipo      TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  icone     TEXT,
  cor       TEXT,
  ordem     INTEGER DEFAULT 0,
  ativo     BOOLEAN DEFAULT TRUE
);

-- Transações
CREATE TABLE IF NOT EXISTS fp_transacoes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id   UUID REFERENCES fp_categorias(id) ON DELETE SET NULL,
  descricao      TEXT NOT NULL,
  valor          NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  tipo           TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  data           DATE NOT NULL,
  recorrente_id  UUID,
  notas          TEXT,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- Recorrentes (templates de despesas/receitas fixas mensais)
CREATE TABLE IF NOT EXISTS fp_recorrentes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id  UUID REFERENCES fp_categorias(id) ON DELETE SET NULL,
  descricao     TEXT NOT NULL,
  valor         NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  tipo          TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  dia_do_mes    INTEGER NOT NULL CHECK (dia_do_mes BETWEEN 1 AND 31),
  ativo         BOOLEAN DEFAULT TRUE,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

-- Orçamentos mensais por categoria
CREATE TABLE IF NOT EXISTS fp_orcamentos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id  UUID NOT NULL REFERENCES fp_categorias(id) ON DELETE CASCADE,
  valor_limite  NUMERIC(10,2) NOT NULL CHECK (valor_limite > 0),
  mes           TEXT NOT NULL, -- YYYY-MM
  UNIQUE(user_id, categoria_id, mes)
);

-- Objetivos de poupança
CREATE TABLE IF NOT EXISTS fp_objetivos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  valor_objetivo  NUMERIC(10,2) NOT NULL CHECK (valor_objetivo > 0),
  valor_atual     NUMERIC(10,2) NOT NULL DEFAULT 0,
  data_limite     DATE,
  ativo           BOOLEAN DEFAULT TRUE,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE fp_perfis      ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_categorias  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_transacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_recorrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_orcamentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_objetivos   ENABLE ROW LEVEL SECURITY;

-- fp_perfis
CREATE POLICY "fp_perfis_own" ON fp_perfis FOR ALL USING (auth.uid() = user_id);

-- fp_categorias: lê categorias do sistema (user_id NULL) + as suas próprias
CREATE POLICY "fp_categorias_read"  ON fp_categorias FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "fp_categorias_write" ON fp_categorias FOR ALL   USING (auth.uid() = user_id);

-- fp_transacoes
CREATE POLICY "fp_transacoes_own" ON fp_transacoes FOR ALL USING (auth.uid() = user_id);

-- fp_recorrentes
CREATE POLICY "fp_recorrentes_own" ON fp_recorrentes FOR ALL USING (auth.uid() = user_id);

-- fp_orcamentos
CREATE POLICY "fp_orcamentos_own" ON fp_orcamentos FOR ALL USING (auth.uid() = user_id);

-- fp_objetivos
CREATE POLICY "fp_objetivos_own" ON fp_objetivos FOR ALL USING (auth.uid() = user_id);

-- ─── Categorias padrão do sistema ────────────────────────────────────────────

INSERT INTO fp_categorias (user_id, nome, tipo, icone, cor, ordem) VALUES
  -- Receitas
  (NULL, 'Salário',        'receita', 'payments',         '#166534', 1),
  (NULL, 'Freelance',      'receita', 'laptop_mac',       '#166534', 2),
  (NULL, 'Rendas',         'receita', 'home',             '#166534', 3),
  (NULL, 'Investimentos',  'receita', 'trending_up',      '#166534', 4),
  (NULL, 'Outros',         'receita', 'add_circle',       '#166534', 5),
  -- Despesas
  (NULL, 'Habitação',      'despesa', 'home',             '#1e3a5f', 10),
  (NULL, 'Alimentação',    'despesa', 'restaurant',       '#1e3a5f', 11),
  (NULL, 'Transporte',     'despesa', 'directions_car',   '#1e3a5f', 12),
  (NULL, 'Saúde',          'despesa', 'medical_services', '#1e3a5f', 13),
  (NULL, 'Lazer',          'despesa', 'sports_esports',   '#1e3a5f', 14),
  (NULL, 'Subscrições',    'despesa', 'subscriptions',    '#1e3a5f', 15),
  (NULL, 'Seguros',        'despesa', 'security',         '#1e3a5f', 16),
  (NULL, 'Vestuário',      'despesa', 'checkroom',        '#1e3a5f', 17),
  (NULL, 'Educação',       'despesa', 'school',           '#1e3a5f', 18),
  (NULL, 'Poupança',       'despesa', 'savings',          '#1e3a5f', 19),
  (NULL, 'Outros',         'despesa', 'more_horiz',       '#1e3a5f', 20)
ON CONFLICT DO NOTHING;
