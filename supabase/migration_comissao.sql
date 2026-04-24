-- Comissão do espaço (Cenário A: trabalhador independente que paga % ao dono)
ALTER TABLE barbearias
  ADD COLUMN IF NOT EXISTS comissao_ativa boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS comissao_percentagem numeric(5,2) DEFAULT 0;
