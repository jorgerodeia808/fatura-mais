-- Ativar/desativar email de resumo automático ao barbeiro (24h antes)
ALTER TABLE barbearias
  ADD COLUMN IF NOT EXISTS email_lembrete_barbeiro_ativo BOOLEAN DEFAULT TRUE;
