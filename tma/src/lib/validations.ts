import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido").transform(v => v.toLowerCase()),
  password: z.string().min(1, "La contraseña es requerida"),
})

export const registerSchema = z.object({
  email: z.string().email("Email inválido").transform(v => v.toLowerCase()),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
})

export type LoginSchema = z.infer<typeof loginSchema>
export type RegisterSchema = z.infer<typeof registerSchema>

const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/

function isValidDDMMYYYY(val: string): boolean {
  if (!dateRegex.test(val)) return false
  const [dd, mm] = val.split("/").map(Number)
  return dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12
}

export const casoSchema = z.object({
  nombre: z.string().min(1, "El nombre del asunto es obligatorio."),
  fechaIngreso: z.string().refine(isValidDDMMYYYY, "Ingresá una fecha válida (dd/mm/aaaa)."),
  fechaVencimiento: z.string().refine(isValidDDMMYYYY, "Ingresá una fecha válida (dd/mm/aaaa)."),
  responsable: z.string().min(1, "El responsable es obligatorio."),
})

export type CasoSchema = z.infer<typeof casoSchema>
