import { NextRequest } from 'next/server'

// Proxy route: fetches the QR image server-side and returns it for download,
// avoiding CORS restrictions on direct client-side fetches to api.qrserver.com
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug    = searchParams.get('slug') ?? 'qr'
  const data    = searchParams.get('data')

  if (!data) {
    return new Response('Missing data param', { status: 400 })
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=512x512&color=1C1917&bgcolor=FFFFFF&margin=4&format=png`

  const upstream = await fetch(qrUrl)
  if (!upstream.ok) {
    return new Response('QR generation failed', { status: 502 })
  }

  const buffer = await upstream.arrayBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qr-${slug}.png"`,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
