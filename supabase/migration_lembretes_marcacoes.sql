-- Email no CRM de clientes
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Email do cliente na marcação (preenchido no agendamento online ou pelo admin)
ALTER TABLE marcacoes
  ADD COLUMN IF NOT EXISTS cliente_email TEXT;

-- Rastrear envio de email de lembrete 24h antes
ALTER TABLE marcacoes
  ADD COLUMN IF NOT EXISTS email_lembrete_enviado BOOLEAN DEFAULT FALSE;

-- Mensagem personalizada do barbeiro no email de lembrete ao cliente
ALTER TABLE barbearias
  ADD COLUMN IF NOT EXISTS mensagem_lembrete_email TEXT;
