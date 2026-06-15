import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

// Mock next/navigation — CasosSidebar usa usePathname para determinar el ítem activo
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/casos"),
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}))

// Mock motion/react — evitar animaciones en tests
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CasosSidebar } from "@/components/casos/CasosSidebar"

describe("CasosSidebar — UI-05", () => {
  it("renderiza el ítem Dashboard", () => {
    render(<CasosSidebar />)
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1)
  })

  it("renderiza el ítem Nuevo asunto", () => {
    render(<CasosSidebar />)
    expect(screen.getAllByText("Nuevo asunto").length).toBeGreaterThanOrEqual(1)
  })

  it("renderiza el ítem Estadísticas", () => {
    render(<CasosSidebar />)
    expect(screen.getAllByText("Estadísticas").length).toBeGreaterThanOrEqual(1)
  })

  it("renderiza el badge 'Próximamente' en el ítem Estadísticas (D-03)", () => {
    render(<CasosSidebar />)
    expect(screen.getAllByText("Próximamente").length).toBeGreaterThanOrEqual(1)
  })
})
