export type NichoId = 'barbeiro' | 'tatuador' | 'estetica'

export interface NichoConfig {
  id: NichoId
  nome: string          // nome do produto (ex: "Fatura+")
  nomeProfissional: string  // ex: "barbeiro", "tatuador", "esteticista"
  nomeNegocio: string       // ex: "barbearia", "estúdio", "salão"
  nomePlural: string        // ex: "barbeiros", "tatuadores", "esteticistas"
  cor: string               // cor primária em hex
  subdominio: string        // ex: "barbeiro"
  features: {
    marcacoes: boolean
    despesas: boolean
    relatorios: boolean
    conselheiro_ia: boolean
    produtos: boolean
    faturacao: boolean
  }
}
