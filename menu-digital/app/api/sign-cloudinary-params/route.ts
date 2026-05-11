import { auth } from '@clerk/nextjs/server'
import { createHash } from 'crypto'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'No autorizado.' }, { status: 401 })

  const apiSecret = process.env.CLOUDINARY_API_SECRET as string
  const timestamp = Math.round(Date.now() / 1000)

  // Cloudinary signature: sort params alphabetically, join as key=value pairs, append secret, SHA-1
  const paramsToSign = { folder: 'menu-digital', timestamp }
  const toSign = Object.keys(paramsToSign)
    .sort()
    .map(k => `${k}=${paramsToSign[k as keyof typeof paramsToSign]}`)
    .join('&')

  const signature = createHash('sha1')
    .update(toSign + apiSecret)
    .digest('hex')

  return Response.json({
    signature,
    timestamp,
    api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  })
}
