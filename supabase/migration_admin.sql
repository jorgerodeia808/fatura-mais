-- =============================================================
-- Fatura+ Admin Panel Migration
-- =============================================================

-- 1. Add admin/billing columns to public.barbearias
-- =============================================================

ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'trial'
    CHECK (plano IN ('trial', 'vitalicio', 'mensal', 'suspenso')),
  ADD COLUMN IF NOT EXISTS trial_termina_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proximo_pagamento TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valor_pago_total NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS notas TEXT,
  ADD COLUMN IF NOT EXISTS indicado_por UUID REFERENCES public.barbearias(id);

-- =============================================================
-- 2. Create public.admins table
-- =============================================================

CREATE TABLE IF NOT EXISTS public.admins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Only admins can read the admins table
CREATE POLICY "admins_select_policy"
  ON public.admins
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =============================================================
-- 3. Create public.pagamentos_recebidos table
-- =============================================================

CREATE TABLE IF NOT EXISTS public.pagamentos_recebidos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbearia_id  UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  valor         NUMERIC(10,2) NOT NULL,
  metodo        TEXT NOT NULL CHECK (metodo IN ('mbway', 'numerario', 'multibanco')),
  data          DATE NOT NULL DEFAULT CURRENT_DATE,
  notas         TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pagamentos_recebidos ENABLE ROW LEVEL SECURITY;

-- Only admins can access pagamentos_recebidos
CREATE POLICY "pagamentos_admin_all_policy"
  ON public.pagamentos_recebidos
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =============================================================
-- 4. Index for common query pattern
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_pagamentos_barbearia_data
  ON public.pagamentos_recebidos(barbearia_id, data);

-- =============================================================
-- Para te adicionar como admin, executa:
-- INSERT INTO public.admins (user_id) VALUES ('SEU_USER_ID_AQUI');
-- =============================================================
