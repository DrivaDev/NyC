import { describe, it, expect } from "vitest"
import { casoSchema } from "@/lib/validations"

describe("casoSchema — CASOS-02", () => {
  it("acepta datos válidos con los 4 campos completos", () => {
    const result = casoSchema.safeParse({
      nombre: "García c/ López s/ daños",
      fechaIngreso: "15/06/2026",
      fechaVencimiento: "31/12/2026",
      responsable: "C. Rivera",
    })
    expect(result.success).toBe(true)
  })

  it("rechaza cuando nombre está vacío", () => {
    const result = casoSchema.safeParse({
      nombre: "",
      fechaIngreso: "15/06/2026",
      fechaVencimiento: "31/12/2026",
      responsable: "C. Rivera",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nombreError = result.error.issues.find(i => i.path[0] === "nombre")
      expect(nombreError?.message).toBe("El nombre del asunto es obligatorio.")
    }
  })

  it("rechaza cuando fechaIngreso está vacía", () => {
    const result = casoSchema.safeParse({
      nombre: "Test",
      fechaIngreso: "",
      fechaVencimiento: "31/12/2026",
      responsable: "C. Rivera",
    })
    expect(result.success).toBe(false)
  })

  it("rechaza cuando fechaVencimiento está vacía", () => {
    const result = casoSchema.safeParse({
      nombre: "Test",
      fechaIngreso: "15/06/2026",
      fechaVencimiento: "",
      responsable: "C. Rivera",
    })
    expect(result.success).toBe(false)
  })

  it("rechaza cuando responsable está vacío", () => {
    const result = casoSchema.safeParse({
      nombre: "Test",
      fechaIngreso: "15/06/2026",
      fechaVencimiento: "31/12/2026",
      responsable: "",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const respError = result.error.issues.find(i => i.path[0] === "responsable")
      expect(respError?.message).toBe("El responsable es obligatorio.")
    }
  })
})
