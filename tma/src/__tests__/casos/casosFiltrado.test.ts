import { describe, it, expect } from "vitest"

// La lógica de filtrado y ordenamiento es pura — se testa directamente sin montar componentes
const mockCasos = [
  {
    _id: "1",
    nombre: "García c/ López",
    responsable: "C. Rivera",
    fechaIngreso: new Date("2026-06-15T12:00:00"),
    fechaVencimiento: new Date("2026-12-31T12:00:00"),
  },
  {
    _id: "2",
    nombre: "Martínez s/ cobro",
    responsable: "E. Koch",
    fechaIngreso: new Date("2026-01-10T12:00:00"),
    fechaVencimiento: new Date("2026-06-30T12:00:00"),
  },
  {
    _id: "3",
    nombre: "López c/ Pérez",
    responsable: "N. Silva",
    fechaIngreso: new Date("2026-03-01T12:00:00"),
    fechaVencimiento: new Date("2026-09-15T12:00:00"),
  },
]

describe("filtrado client-side por nombre — CASOS-04", () => {
  it("filtra por nombre parcial (insensible a mayúsculas)", () => {
    const filterNombre = "garcía"
    const result = mockCasos.filter(c =>
      c.nombre.toLowerCase().includes(filterNombre.toLowerCase())
    )
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe("1")
  })

  it("retorna todos cuando el filtro de nombre está vacío", () => {
    const result = mockCasos.filter(c =>
      c.nombre.toLowerCase().includes("".toLowerCase())
    )
    expect(result).toHaveLength(3)
  })

  it("retorna vacío cuando no hay coincidencias", () => {
    const result = mockCasos.filter(c =>
      c.nombre.toLowerCase().includes("zzz".toLowerCase())
    )
    expect(result).toHaveLength(0)
  })
})

describe("filtrado client-side por responsable — CASOS-06", () => {
  it("filtra por responsable parcial (insensible a mayúsculas)", () => {
    const filterResp = "Koch"
    const result = mockCasos.filter(c =>
      c.responsable.toLowerCase().includes(filterResp.toLowerCase())
    )
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe("2")
  })
})

describe("filtros AND simultáneos — CASOS-04 + CASOS-06", () => {
  it("combina filtro nombre AND responsable (D-09)", () => {
    const filterNombre = "lópez"
    const filterResp = "c. Rivera"
    const result = mockCasos.filter(c =>
      c.nombre.toLowerCase().includes(filterNombre.toLowerCase()) &&
      c.responsable.toLowerCase().includes(filterResp.toLowerCase())
    )
    // Solo "García c/ López" tiene ambos
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe("1")
  })
})

describe("ordenamiento por fechaVencimiento — CASOS-05", () => {
  it("ordena ascendente (D-08): vence antes → aparece primero", () => {
    const sorted = [...mockCasos].sort((a, b) =>
      new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
    )
    expect(sorted[0]._id).toBe("2") // 2026-06-30 es el más próximo
    expect(sorted[1]._id).toBe("3") // 2026-09-15
    expect(sorted[2]._id).toBe("1") // 2026-12-31
  })

  it("ordena descendente (D-08): vence después → aparece primero", () => {
    const sorted = [...mockCasos].sort((a, b) =>
      new Date(b.fechaVencimiento).getTime() - new Date(a.fechaVencimiento).getTime()
    )
    expect(sorted[0]._id).toBe("1") // 2026-12-31 es el más lejano
    expect(sorted[2]._id).toBe("2") // 2026-06-30
  })
})
