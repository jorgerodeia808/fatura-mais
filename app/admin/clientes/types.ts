export interface ClienteUnificado {
  id: string
  user_id: string
  nome: string
  email: string
  plano: string | null
  nicho: string
  criado_em: string
  subscricao_renovacao: string | null
  valor_pago_total: number | null
  metodo_pagamento: string | null
  indicado_por: string | null
  notas: string | null
}
