import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { Footer } from "@/components/Footer"
import { Navbar } from "@/components/Navbar"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TMA — Nicholson & Cano",
  description: "App interna de gestión de asuntos y contratos",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={poppins.variable}>
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
