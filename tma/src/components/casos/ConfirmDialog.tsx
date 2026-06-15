"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  casoNombre: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, casoNombre, onConfirm, onCancel }: ConfirmDialogProps) {
  // Bloquear scroll del body cuando el dialog está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-2xl bg-white border border-[#a8dbde] shadow-lg p-6 max-w-[400px] w-full pointer-events-auto"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Ícono */}
              <div className="flex justify-center mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>

              {/* Título */}
              <p className="text-[16px] font-bold text-brand-title text-center mb-2">
                ¿Eliminar asunto?
              </p>

              {/* Body */}
              <p className="text-[13px] text-brand-text/70 text-center mb-6">
                Esta acción no se puede deshacer. Se eliminará el asunto{" "}
                <strong className="text-brand-text">&ldquo;{casoNombre}&rdquo;</strong>.
              </p>

              {/* Botones */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-[13px] rounded-lg border border-[#a8dbde] text-brand-title
                             hover:bg-brand-accent/20 transition-colors duration-150 min-h-[44px]"
                >
                  No, mantener
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 text-[13px] rounded-lg bg-red-600 text-white
                             hover:bg-red-700 transition-colors duration-150 min-h-[44px]"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
