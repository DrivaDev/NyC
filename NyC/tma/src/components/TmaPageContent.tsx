"use client"

import { TextureCard } from "@/components/ui/texture-card"
import { motion } from "motion/react"

export function TmaPageContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-background py-16 px-4">
      <div className="w-full max-w-[640px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <h1 className="text-[28px] font-bold text-brand-title mb-2">
            Bienvenido, NyC
          </h1>
          <p className="text-[14px] font-normal text-brand-text">
            Seleccioná un módulo para comenzar
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card 1: Casos TMA — DISABLED (D-07) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
            className="opacity-40 cursor-not-allowed pointer-events-none select-none"
            aria-disabled="true"
          >
            <TextureCard className="h-full p-6">
              <h2 className="text-[20px] font-bold text-brand-title mb-2">
                Casos TMA
              </h2>
              <p className="text-[14px] font-normal text-brand-text">
                Gestión de asuntos
              </p>
              <p className="text-[11px] font-normal text-brand-text mt-4">
                Disponible próximamente
              </p>
            </TextureCard>
          </motion.div>

          {/* Card 2: Contratos TMA — DISABLED (D-07) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
            className="opacity-40 cursor-not-allowed pointer-events-none select-none"
            aria-disabled="true"
          >
            <TextureCard className="h-full p-6">
              <h2 className="text-[20px] font-bold text-brand-title mb-2">
                Contratos TMA
              </h2>
              <p className="text-[14px] font-normal text-brand-text">
                Generación de contratos
              </p>
              <p className="text-[11px] font-normal text-brand-text mt-4">
                Disponible próximamente
              </p>
            </TextureCard>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
