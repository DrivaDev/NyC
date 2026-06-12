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
