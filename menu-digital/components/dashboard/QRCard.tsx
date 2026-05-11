'use client'

import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'

interface QRCardProps {
  menuUrl: string
  slug: string
}

export default function QRCard({ menuUrl, slug }: QRCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    // qrcode runs client-side only — avoids Turbopack server-side module resolution
    import('qrcode').then(({ default: QRCode }) => {
      const canvas = canvasRef.current
      if (!canvas) return
      QRCode.toCanvas(canvas, menuUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#1C1917', light: '#FFFFFF' },
      }, (err) => {
        if (!err) setDataUrl(canvas.toDataURL('image/png'))
      })
    })
  }, [menuUrl])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-brand-acento p-6 flex flex-col items-center gap-4">
      <h2 className="text-base font-bold text-brand-titulares self-start">
        Tu QR
      </h2>

      {/* QR canvas — renders client-side after hydration */}
      <div className="p-3 border border-brand-acento rounded-lg">
        <canvas ref={canvasRef} width={200} height={200} />
      </div>

      {/* Menu URL — clickable link opens menu in new tab */}
      <a
        href={menuUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-2 bg-brand-fondo rounded-md px-4 py-3 hover:bg-brand-acento transition-colors duration-150 group"
      >
        <span className="font-mono text-xs text-brand-texto truncate group-hover:text-brand-titulares">
          {menuUrl}
        </span>
      </a>

      {/* Download button — enabled once canvas has rendered */}
      <a
        href={dataUrl || '#'}
        download={dataUrl ? `qr-${slug}.png` : undefined}
        aria-disabled={!dataUrl}
        className={`w-full flex items-center justify-center gap-2 bg-brand-principal text-white text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors duration-150 ${!dataUrl ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <Download size={16} />
        Descargar QR
      </a>

      {/* Ver mi menú — secondary affordance */}
      <a
        href={menuUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 border border-brand-principal text-brand-principal text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-brand-fondo focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors duration-150"
      >
        Ver mi menú
      </a>
    </div>
  )
}
