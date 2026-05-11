import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MenuDig — Menú digital con QR para restaurantes'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FFF7ED',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: '#EA580C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1" fill="white" />
            <rect x="3" y="14" width="7" height="7" rx="1" fill="white" />
            <rect x="14" y="3" width="7" height="7" rx="1" fill="white" />
            <rect x="14" y="14" width="3" height="3" fill="white" />
            <rect x="19" y="14" width="2" height="2" fill="white" />
            <rect x="14" y="19" width="2" height="2" fill="white" />
            <rect x="18" y="19" width="3" height="2" fill="white" />
          </svg>
        </div>

        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            color: '#9A3412',
            letterSpacing: '-2px',
            marginBottom: 20,
          }}
        >
          MenuDig
        </div>

        <div
          style={{
            fontSize: 34,
            color: '#1C1917',
            textAlign: 'center',
            maxWidth: 780,
            lineHeight: 1.4,
            marginBottom: 44,
          }}
        >
          El menú digital de tu restaurante, accesible por QR
        </div>

        <div
          style={{
            background: '#EA580C',
            borderRadius: 14,
            padding: '14px 40px',
            fontSize: 24,
            color: 'white',
            fontWeight: 600,
          }}
        >
          14 días gratis · Sin tarjeta · menudig.com.ar
        </div>
      </div>
    ),
    size,
  )
}
