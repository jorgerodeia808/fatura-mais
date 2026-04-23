'use client'

import { getNichoConfig } from '@/lib/nicho'

export default function NichoLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const config = getNichoConfig()
  const sizes = {
    sm: { box: 36, text: '1.1rem' },
    md: { box: 44, text: '1.35rem' },
    lg: { box: 56, text: '1.7rem' },
  }
  const s = sizes[size]

  return (
    <div
      style={{
        width: s.box,
        height: s.box,
        backgroundColor: config.cor,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        fontWeight: 700,
        fontStyle: 'italic',
        fontSize: s.text,
        color: 'white',
        flexShrink: 0,
      }}
    >
      {config.letraLogo}
      <span style={{ color: config.corDestaque }}>+</span>
    </div>
  )
}
