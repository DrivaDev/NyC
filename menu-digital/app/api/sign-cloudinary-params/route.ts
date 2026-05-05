import { auth } from '@clerk/nextjs/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure once at module scope — not inside the request handler
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST() {
  // Guard: only authenticated users may obtain upload credentials
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = { timestamp, folder: 'menu-digital' }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  )

  return Response.json({
    signature,
    timestamp,
    api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  })
}
