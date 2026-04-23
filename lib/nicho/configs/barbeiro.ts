import type { NichoConfig } from '../types'

const barbeiro: NichoConfig = {
  id: 'barbeiro',
  nome: 'Barber+',
  nomeProfissional: 'barbeiro',
  nomeNegocio: 'barbearia',
  nomePlural: 'barbeiros',
  cor: '#2d2d2d',
  corDestaque: '#977c30',
  corTexto: '#2d2d2d',
  corFundo: '#f7f5f0',
  subdominio: 'barbeiro',
  letraLogo: 'B',
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
