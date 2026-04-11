-- ================================================================
-- Migração: SMS automático (Módulo 7)
-- Executa este ficheiro no SQL Editor do Supabase
-- ================================================================

-- Adiciona campos à tabela marcacoes
ALTER TABLE public.marcacoes
  ADD COLUMN IF NOT EXISTS sms_enviado_em TIMESTAMPTZ;

-- Adiciona campos à tabela barbearias
ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS sms_ativo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sms_mensagem_personalizada TEXT;
