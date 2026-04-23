import type { NichoId, NichoConfig } from './types'
import barbeiro from './configs/barbeiro'
import tatuador from './configs/tatuador'
import estetica from './configs/estetica'

const configs: Record<NichoId, NichoConfig> = { barbeiro, tatuador, estetica }

export function getNichoConfig(): NichoConfig {
  const nicho = (process.env.NEXT_PUBLIC_NICHO ?? 'barbeiro') as NichoId
  return configs[nicho] ?? barbeiro
}

export function getNichoFromHostname(hostname: string): NichoConfig {
  if (hostname.startsWith('tatuador.')) return tatuador
  if (hostname.startsWith('estetica.')) return estetica
  return barbeiro
}

export type { NichoId, NichoConfig }
