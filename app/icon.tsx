import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  const nicho = process.env.NEXT_PUBLIC_NICHO

  const configs: Record<string, { cor: string; corDestaque: string; letra: string }> = {
    barbeiro: { cor: '#2d2d2d', corDestaque: '#977c30', letra: 'B' },
    nails:    { cor: '#e8779a', corDestaque: 'rgba(255,255,255,0.65)', letra: 'N' },
    lash:     { cor: '#4a148c', corDestaque: '#c9a96e', letra: 'L' },
    tatuador: { cor: '#111111', corDestaque: '#c62828', letra: 'T' },
  }

  const c = nicho ? configs[nicho] : null

  // Landing geral — usa o verde do Fatura+
  const bg    = c?.cor ?? '#0e4324'
  const plus  = c?.corDestaque ?? '#977c30'
  const letra = c?.letra ?? 'F'

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
          fontSize: 15,
          color: 'white',
          letterSpacing: '-0.5px',
        }}
      >
        {letra}
        <span style={{ color: plus, fontSize: 13 }}>+</span>
      </div>
    ),
    { ...size }
  )
}
