"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Briefcase, FileText } from "lucide-react"

const modules = [
  {
    title: "Casos TMA",
    description: "Gestión de asuntos y seguimiento de causas",
    Icon: Briefcase,
    delay: 0.1,
    href: null, // disabled — Phase 4
  },
  {
    title: "Contratos TMA",
    description: "Generación automática de contratos vía Gemini",
    Icon: FileText,
    delay: 0.2,
    href: "/tma/contratos", // activated in Phase 2
  },
]

export function TmaPageContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-background py-16 px-4">
      <div className="w-full max-w-[680px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="text-[30px] font-bold text-brand-title mb-2 tracking-tight">
            Bienvenido, NyC
          </h1>
          <p className="text-[14px] text-brand-text/60">
            Seleccioná un módulo para comenzar
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {modules.map(({ title, description, Icon, delay, href }) =>
            href ? (
              <Link key={title} href={href} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.025, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  style={{ originY: 0.5 }}
                  className="cursor-pointer"
                >
                  <div
                    className="h-full p-6 flex flex-col gap-4 rounded-2xl"
                    style={{
                      background: "linear-gradient(145deg, #FFFFFF 0%, #FFF7ED 100%)",
                      border: "1px solid #FECBA1",
                      boxShadow: "0 1px 3px 0 rgba(154,52,18,0.06), 0 1px 2px -1px rgba(154,52,18,0.04)",
                    }}
                  >
                    {/* Ícono */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "#FED7AA" }}
                    >
                      <Icon size={20} style={{ color: "#9A3412" }} strokeWidth={1.75} />
                    </div>

                    {/* Contenido */}
                    <div>
                      <h2 className="text-[17px] font-semibold text-brand-title leading-snug mb-1">
                        {title}
                      </h2>
                      <p className="text-[13px] text-brand-text/70 leading-relaxed">
                        {description}
                      </p>
                    </div>

                    {/* Badge — Disponible */}
                    <span
                      className="self-start text-[11px] font-medium px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: "#EA580C", color: "#FFFFFF" }}
                    >
                      Disponible
                    </span>
                  </div>
                </motion.div>
              </Link>
            ) : (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 0.45, y: 0 }}
                whileHover={{ opacity: 0.65, scale: 1.025, y: -3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{ originY: 0.5 }}
                className="cursor-not-allowed"
                aria-disabled="true"
              >
                <div
                  className="h-full p-6 flex flex-col gap-4 rounded-2xl"
                  style={{
                    background: "linear-gradient(145deg, #FFFFFF 0%, #FFF7ED 100%)",
                    border: "1px solid #FECBA1",
                    boxShadow: "0 1px 3px 0 rgba(154,52,18,0.06), 0 1px 2px -1px rgba(154,52,18,0.04)",
                  }}
                >
                  {/* Ícono */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#FED7AA" }}
                  >
                    <Icon size={20} style={{ color: "#9A3412" }} strokeWidth={1.75} />
                  </div>

                  {/* Contenido */}
                  <div>
                    <h2 className="text-[17px] font-semibold text-brand-title leading-snug mb-1">
                      {title}
                    </h2>
                    <p className="text-[13px] text-brand-text/70 leading-relaxed">
                      {description}
                    </p>
                  </div>

                  {/* Badge */}
                  <span
                    className="self-start text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "#FED7AA", color: "#9A3412" }}
                  >
                    Próximamente
                  </span>
                </div>
              </motion.div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
