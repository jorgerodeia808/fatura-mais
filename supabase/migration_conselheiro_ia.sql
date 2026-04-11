-- ================================================================
-- Migração: adiciona campos de rate limiting para o Conselheiro IA
-- Executa este ficheiro no SQL Editor do Supabase
-- ================================================================

ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS ai_mensagens_hoje INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_data_reset TIMESTAMPTZ;
