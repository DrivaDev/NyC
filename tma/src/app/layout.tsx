import type { Metadata } from "next"
import { Sora } from "next/font/google"
import { Footer } from "@/components/Footer"
import { Navbar } from "@/components/Navbar"
import "./globals.css"

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sora",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TMA — Nicholson & Cano",
  description: "App interna de gestión de asuntos y contratos",
  icons: { icon: "/favicon.svg" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={sora.variable}>
      <body className="min-h-screen flex flex-col bg-brand-background text-brand-text antialiased">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
