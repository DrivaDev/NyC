import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

// Mock motion/react para evitar problemas con AnimatePresence en tests
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { TmaPageContent } from "@/components/TmaPageContent"

describe("TmaPageContent — UI-04", () => {
  it("renderiza el card 'Casos TMA'", () => {
    render(<TmaPageContent />)
    expect(screen.getByText("Casos TMA")).toBeInTheDocument()
  })

  it("el card 'Casos TMA' tiene href='/tma/casos' (activado en Phase 4)", () => {
    render(<TmaPageContent />)
    const link = screen.getByRole("link", { name: /Casos TMA/i })
    expect(link).toHaveAttribute("href", "/tma/casos")
  })

  it("el card 'Contratos TMA' tiene href='/tma/contratos'", () => {
    render(<TmaPageContent />)
    const link = screen.getByRole("link", { name: /Contratos TMA/i })
    expect(link).toHaveAttribute("href", "/tma/contratos")
  })
})
