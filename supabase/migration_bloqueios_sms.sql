-- ================================================================
-- Migration: Bloqueios de Horário + Templates SMS Marcações Online
-- ================================================================

-- ----------------------------------------------------------------
-- BLOQUEIOS DE HORÁRIO
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bloqueios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbearia_id  UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  data          DATE NOT NULL,
  hora_inicio   TIME NOT NULL,
  hora_fim      TIME NOT NULL,
  motivo        TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bloqueios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador gere os seus bloqueios" ON public.bloqueios
  FOR ALL USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Público pode ver bloqueios para disponibilidade" ON public.bloqueios
  FOR SELECT USING (
    barbearia_id IN (
      SELECT id FROM public.barbearias WHERE marcacoes_online = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_bloqueios_barbearia_data ON public.bloqueios(barbearia_id, data);

-- ----------------------------------------------------------------
-- Templates SMS de Marcações Online (em barbearias)
-- ----------------------------------------------------------------
ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS sms_reserva_recebida  TEXT,
  ADD COLUMN IF NOT EXISTS sms_reserva_confirmada TEXT,
  ADD COLUMN IF NOT EXISTS sms_reserva_cancelada  TEXT;
