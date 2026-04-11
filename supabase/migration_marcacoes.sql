-- ================================================================
-- Migração: adiciona campos de marcações online à tabela barbearias
-- Executa este ficheiro no SQL Editor do Supabase
-- ================================================================

ALTER TABLE public.barbearias
  ADD COLUMN IF NOT EXISTS marcacoes_online BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Gera slugs automáticos para barbearias existentes
UPDATE public.barbearias
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(nome, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;
