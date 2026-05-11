import type { Metadata } from 'next'
import { Fira_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-fira-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://menudig.com.ar'),
  title: {
    default: 'MenuDig — Menú digital con QR para restaurantes',
    template: '%s | MenuDig',
  },
  description: 'Creá el menú digital de tu restaurante en minutos. Tus clientes lo ven escaneando un QR, sin descargar nada. 14 días gratis, sin tarjeta.',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://menudig.com.ar',
    siteName: 'MenuDig',
    title: 'MenuDig — Menú digital con QR para restaurantes',
    description: 'Creá el menú digital de tu restaurante en minutos. Tus clientes lo ven escaneando un QR, sin descargar nada. 14 días gratis, sin tarjeta.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MenuDig — Menú digital con QR para restaurantes',
    description: 'Creá el menú digital de tu restaurante en minutos. Tus clientes lo ven escaneando un QR, sin descargar nada. 14 días gratis, sin tarjeta.',
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={firaSans.variable}>
      <body className="bg-brand-fondo font-sans">
        <ClerkProvider afterSignOutUrl="/sign-in">
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
