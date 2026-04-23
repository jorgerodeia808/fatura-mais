import type { NichoConfig } from '../types'

const barbeiro: NichoConfig = {
  id: 'barbeiro',
  nome: 'Fatura+',
  nomeProfissional: 'barbeiro',
  nomeNegocio: 'barbearia',
  nomePlural: 'barbeiros',
  cor: '#0e4324',
  subdominio: 'barbeiro',
  features: {
    marcacoes: true,
    despesas: true,
    relatorios: true,
    conselheiro_ia: true,
    produtos: true,
    faturacao: true,
  },
}

export default barbeiro
