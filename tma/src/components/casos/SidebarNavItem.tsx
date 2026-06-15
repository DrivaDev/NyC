"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"

interface SidebarNavItemProps {
  label: string
  href: string | null  // null = deshabilitado
  icon: LucideIcon
  isActive: boolean
  badge?: string       // "Próximamente"
}

export function SidebarNavItem({ label, href, icon: Icon, isActive, badge }: SidebarNavItemProps) {
  if (!href) {
    // Ítem deshabilitado (Estadísticas — Fase 5)
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg opacity-45 cursor-not-allowed select-none"
        aria-disabled="true"
      >
        <Icon size={18} />
        <span className="text-[16px] font-normal text-brand-text flex-1">{label}</span>
        {badge && (
          <span className="text-[11px] font-normal px-2 py-1 rounded-full bg-brand-accent text-brand-title">
            {badge}
          </span>
        )}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 no-underline",
        isActive
          ? "bg-brand-accent/30 text-brand-title border-l-2 border-brand-primary font-normal"
          : "text-brand-text hover:bg-brand-accent/15",
      ].join(" ")}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        size={18}
        className={isActive ? "text-brand-primary" : ""}
      />
      <span className="text-[16px] font-normal flex-1">{label}</span>
      {badge && (
        <span className="text-[11px] font-normal px-2 py-1 rounded-full bg-brand-accent text-brand-title">
          {badge}
        </span>
      )}
    </Link>
  )
}
