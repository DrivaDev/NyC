"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logoutAction } from "@/actions/auth.logout"
import { LogOut } from "lucide-react"

const PUBLIC_PATHS = ["/login", "/register"]

export function Navbar() {
  const pathname = usePathname()

  if (PUBLIC_PATHS.includes(pathname)) return null

  const linkClass = (prefix: string) =>
    [
      "text-[13px] px-3 py-1.5 rounded-lg transition-colors duration-150",
      pathname.startsWith(prefix)
        ? "bg-brand-accent/40 text-brand-primary font-medium"
        : "text-brand-text/70 hover:text-brand-title hover:bg-brand-accent/20",
    ].join(" ")

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#FECBA1] h-14 flex items-center px-6 gap-4">
      {/* Brand */}
      <span className="text-[17px] font-bold text-brand-title mr-4 select-none">
        NyC
      </span>

      {/* Nav links */}
      <nav className="flex items-center gap-1 flex-1">
        <Link href="/casos" className={linkClass("/casos")}>
          Casos
        </Link>
        <Link href="/contratos" className={linkClass("/contratos")}>
          Contratos
        </Link>
      </nav>

      {/* Logout */}
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex items-center gap-1.5 text-[13px] text-brand-text/60 hover:text-red-500 transition-colors duration-150 px-2 py-1.5 rounded-lg hover:bg-red-50"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </form>
    </header>
  )
}
