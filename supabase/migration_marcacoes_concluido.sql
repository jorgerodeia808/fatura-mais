-- Adiciona 'concluido' como valor válido para marcacoes.estado
ALTER TABLE marcacoes DROP CONSTRAINT IF EXISTS marcacoes_estado_check;
ALTER TABLE marcacoes ADD CONSTRAINT marcacoes_estado_check
  CHECK (estado IN ('pendente', 'confirmado', 'desistencia', 'concluido'));
