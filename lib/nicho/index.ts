import type { NichoId, NichoConfig } from './types'
import barbeiro from './configs/barbeiro'
import nails from './configs/nails'
import lash from './configs/lash'
import tatuador from './configs/tatuador'

export const nichoConfigs: Record<NichoId, NichoConfig> = {
  barbeiro,
  nails,
  lash,
  tatuador,
}

export const todosOsNichos: NichoConfig[] = [
  { ...barbeiro, ativo: true },
  { ...nails, ativo: true },
  { ...lash, ativo: false },
  { ...tatuador, ativo: false },
]

export function getNichoConfig(): NichoConfig {
  const nicho = (process.env.NEXT_PUBLIC_NICHO ?? 'barbeiro') as NichoId
  return nichoConfigs[nicho] ?? barbeiro
}

export function getNichoFromHostname(hostname: string): NichoConfig {
  if (hostname.startsWith('nails.')) return nails
  if (hostname.startsWith('lash.')) return lash
  if (hostname.startsWith('tatuador.')) return tatuador
  if (hostname.startsWith('barbeiro.')) return barbeiro
  return barbeiro
}

export type { NichoId, NichoConfig }
