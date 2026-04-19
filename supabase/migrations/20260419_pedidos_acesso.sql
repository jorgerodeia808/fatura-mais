-- Tabela para pedidos de acesso ao Fatura+
CREATE TABLE IF NOT EXISTS pedidos_acesso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_barbearia TEXT NOT NULL,
  email TEXT NOT NULL,
  instagram TEXT,
  estado TEXT NOT NULL DEFAULT 'pendente', -- 'pendente' | 'convidado'
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  convidado_em TIMESTAMPTZ
);

ALTER TABLE pedidos_acesso ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode submeter um pedido
CREATE POLICY "pedidos_insert_public" ON pedidos_acesso
  FOR INSERT TO anon, authenticated WITH CHECK (true);
