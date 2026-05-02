import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  const nicho = process.env.NEXT_PUBLIC_NICHO
  const isFP = process.env.NEXT_PUBLIC_APP_TYPE === 'fp'

  const configs: Record<string, { cor: string; corDestaque: string; letra: string; fontSize: number }> = {
    barbeiro: { cor: '#2d2d2d', corDestaque: '#977c30', letra: 'B',  fontSize: 15 },
    nails:    { cor: '#e8779a', corDestaque: 'rgba(255,255,255,0.65)', letra: 'N', fontSize: 15 },
    lash:     { cor: '#4a148c', corDestaque: '#c9a96e', letra: 'L',  fontSize: 15 },
    tatuador: { cor: '#111111', corDestaque: '#c62828', letra: 'T',  fontSize: 15 },
    fp:       { cor: '#1e3a5f', corDestaque: '#c9a84c', letra: 'FP', fontSize: 11 },
  }

  const key = isFP ? 'fp' : (nicho ?? null)
  const c = key ? configs[key] : null

  const bg       = c?.cor      ?? '#0e4324'
  const plus     = c?.corDestaque ?? '#c9a84c'
  const letra    = c?.letra    ?? 'F'
  const fontSize = c?.fontSize ?? 15

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          backgroundColor: bg,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          fontWeight: 700,
          fontSize,
          color: 'white',
          letterSpacing: '-0.5px',
        }}
      >
        {letra}
        <span style={{ color: plus, fontSize: fontSize - 2 }}>+</span>
      </div>
    ),
    { ...size }
  )
}
