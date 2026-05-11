'use client'

import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

interface DashboardShellProps {
  restaurantName?: string
  children: React.ReactNode
}

export default function DashboardShell({ restaurantName, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-brand-fondo overflow-hidden">
      {/* Desktop sidebar — hidden on mobile, shown on md+ */}
      <aside className="hidden md:flex w-64 flex-col shrink-0">
        <Sidebar restaurantName={restaurantName} />
      </aside>

      {/* Mobile drawer overlay — ALWAYS in DOM; opacity toggle enables fade animation */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer panel — always in DOM; CSS transform controls visibility */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar restaurantName={restaurantName} onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Right column: header + main content + footer */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          {children}
          <footer className="mt-auto pt-6 text-center">
            <p className="text-xs font-light text-brand-texto">
              Desarrollado por <strong className="font-bold">Driva Dev</strong>
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
