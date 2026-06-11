import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Footer } from "@/components/Footer"

describe("Footer — UI-03", () => {
  it("UI-03: renderiza el texto 'Desarrollado por'", () => {
    render(<Footer />)
    expect(screen.getByText(/Desarrollado por/i)).toBeInTheDocument()
  })

  it("UI-03: contiene link con texto 'Driva Dev' que apunta a https://drivadev.com.ar", () => {
    render(<Footer />)
    const link = screen.getByRole("link", { name: /Driva Dev/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "https://drivadev.com.ar")
  })

  it("UI-03: el link tiene target='_blank' y rel='noopener noreferrer'", () => {
    render(<Footer />)
    const link = screen.getByRole("link", { name: /Driva Dev/i })
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })
})
