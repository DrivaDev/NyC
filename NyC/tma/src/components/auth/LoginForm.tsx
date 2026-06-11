"use client"

import { useActionState } from "react"
import { loginAction } from "@/actions/auth.login"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TextureButton } from "@/components/ui/texture-button"
import { motion } from "motion/react"
import Link from "next/link"

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, undefined)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-[400px] mx-auto px-4"
    >
      <h1 className="text-[28px] font-bold text-brand-title mb-8 text-center">
        Iniciar sesión
      </h1>

      <form action={action} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-[14px] font-normal text-brand-text">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@nyc.com.ar"
            required
            autoComplete="email"
            className="bg-white border-brand-accent focus-visible:ring-brand-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-[14px] font-normal text-brand-text">
            Contraseña
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="bg-white border-brand-accent focus-visible:ring-brand-primary"
          />
        </div>

        {state?.error && (
          <p className="text-[11px] text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <TextureButton
          type="submit"
          disabled={isPending}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {isPending ? "Ingresando..." : "Iniciar sesión"}
        </TextureButton>
      </form>

      <p className="text-[11px] text-brand-text text-center mt-6">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="text-brand-primary hover:text-brand-title transition-colors">
          Registrate
        </Link>
      </p>
    </motion.div>
  )
}
