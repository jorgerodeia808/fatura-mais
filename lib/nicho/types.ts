export type NichoId = 'barbeiro' | 'nails' | 'lash' | 'tatuador'

export interface NichoConfig {
  id: NichoId
  nome: string            // ex: "Barber+", "Nails+"
  nomeProfissional: string  // ex: "barbeiro", "técnica de unhas"
  nomeNegocio: string       // ex: "barbearia", "estúdio"
  nomePlural: string        // ex: "barbeiros", "técnicas de unhas"
  letraLogo: string         // ex: "B", "N" — para o logo dinâmico
  cor: string               // cor principal em hex
  corDestaque: string       // cor de destaque em hex
  corTexto: string          // cor do texto principal
  corFundo: string          // cor de fundo do site
  subdominio: string        // ex: "barbeiro", "nails"
  ativo?: boolean           // se false, aparece "em manutenção" na landing
  features: {
    marcacoes: boolean
    despesas: boolean
    relatorios: boolean
    conselheiro_ia: boolean
    produtos: boolean
    faturacao: boolean
  }
}
