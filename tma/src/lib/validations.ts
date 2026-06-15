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

export const casoSchema = z.object({
  nombre: z.string().min(1, "El nombre del asunto es obligatorio."),
  fechaIngreso: z.string().min(1, "La fecha de ingreso es obligatoria."),
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es obligatoria."),
  responsable: z.string().min(1, "El responsable es obligatorio."),
})

export type CasoSchema = z.infer<typeof casoSchema>
