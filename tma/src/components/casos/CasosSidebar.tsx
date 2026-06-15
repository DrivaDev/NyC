"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { LayoutDashboard, PlusCircle, BarChart2, Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { SidebarNavItem } from "./SidebarNavItem"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/casos", badge: undefined },
  { label: "Nuevo asunto", icon: PlusCircle, href: "/casos/nuevo", badge: undefined },
  { label: "Estadísticas", icon: BarChart2, href: null, badge: "Próximamente" },
] as const

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-8">
        <h2 className="text-[17px] font-bold text-brand-title">Casos TMA</h2>
      </div>
      <nav className="flex-1 px-2 flex flex-col gap-1">
        {navItems.map(item => (
          <div key={item.label} onClick={onClose}>
            <SidebarNavItem
              label={item.label}
              href={item.href ?? null}
              icon={item.icon}
              isActive={item.href !== null && pathname === item.href}
              badge={item.badge}
            />
          </div>
        ))}
      </nav>
    </div>
  )
}

export function CasosSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Desktop: aside fijo — visible en md+ */}
      <aside
        className="hidden md:flex w-60 shrink-0 flex-col sticky top-0 h-screen overflow-y-auto bg-white border-r border-[#FECBA1]"
      >
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Móvil: botón hamburger fijo */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-[#FECBA1] shadow-sm"
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {isOpen ? <X size={20} className="text-brand-title" /> : <Menu size={20} className="text-brand-title" />}
      </button>

      {/* Móvil: overlay + sidebar animado */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsOpen(false)}
            />
            {/* Sidebar overlay */}
            <motion.aside
              className="fixed top-0 left-0 h-full w-64 z-50 flex flex-col bg-white border-r border-[#FECBA1] md:hidden"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <SidebarContent pathname={pathname} onClose={() => setIsOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
