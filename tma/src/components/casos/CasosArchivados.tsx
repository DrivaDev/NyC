"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ArchiveRestore, Archive, Briefcase, Trash2 } from "lucide-react"
import { ConfirmDialog } from "./ConfirmDialog"

interface CasoData {
  _id: string
  nombre: string
  fechaIngreso: string | Date
  fechaVencimiento: string | Date
  responsable: string
}

function formatDate(dateStr: string | Date): string {
  const s = typeof dateStr === "string" ? dateStr : dateStr.toISOString()
  const d = new Date(s.length === 10 ? s + "T12:00:00" : s)
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

export function CasosArchivados() {
  const [casos, setCasos] = useState<CasoData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; nombre: string } | null>(null)

  useEffect(() => {
    fetch("/api/casos?archivados=1")
      .then(r => {
        if (!r.ok) throw new Error("Error al cargar")
        return r.json()
      })
      .then((data: CasoData[]) => {
        setCasos(data)
        setLoading(false)
      })
      .catch(() => {
        setLoadError("No se pudieron cargar los asuntos archivados. Recargá la página.")
        setLoading(false)
      })
  }, [])

  const handleRestore = async (id: string) => {
    const backup = [...casos]
    setCasos(prev => prev.filter(c => String(c._id) !== id))
    setActionError(null)

    try {
      const res = await fetch(`/api/casos?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivado: false }),
      })
      if (!res.ok) {
        setCasos(backup)
        setActionError("No se pudo restaurar el asunto. Intentá nuevamente.")
      }
    } catch {
      setCasos(backup)
      setActionError("No se pudo restaurar el asunto. Intentá nuevamente.")
    }
  }

  const handleDeleteRequest = (id: string, nombre: string) => {
    setPendingDelete({ id, nombre })
    setConfirmOpen(true)
    setActionError(null)
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setConfirmOpen(false)

    const backup = [...casos]
    setCasos(prev => prev.filter(c => String(c._id) !== id))

    try {
      const res = await fetch(`/api/casos?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        setCasos(backup)
        setActionError("No se pudo eliminar el asunto. Intentá nuevamente.")
      }
    } catch {
      setCasos(backup)
      setActionError("No se pudo eliminar el asunto. Intentá nuevamente.")
    }

    setPendingDelete(null)
  }

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Archive size={22} className="text-brand-title/60" />
          <h1 className="text-[28px] font-bold text-brand-title">Archivados</h1>
        </div>

        {loadError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700">
            {loadError}
          </div>
        )}

        {actionError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-2 mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-brand-accent/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#a8dbde] bg-white">
            <table className="w-full text-[13px] text-brand-text table-fixed">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[16%]" />
                <col className="w-[18%]" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#a8dbde] bg-[#f0f9fa]">
                  <th className="text-left px-4 py-3 text-[13px] font-normal text-brand-title">Nombre</th>
                  <th className="text-left px-4 py-3 text-[13px] font-normal text-brand-title">Fecha de ingreso</th>
                  <th className="text-left px-4 py-3 text-[13px] font-normal text-brand-title">Fecha de vencimiento</th>
                  <th className="text-left px-4 py-3 text-[13px] font-normal text-brand-title">Responsable</th>
                  <th className="text-left px-4 py-3 text-[13px] font-normal text-brand-title">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {casos.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center h-48 gap-3">
                        <Briefcase size={32} className="text-brand-accent" />
                        <p className="text-[16px] font-normal text-brand-title">Sin asuntos archivados</p>
                        <p className="text-[13px] text-brand-text/60 text-center">
                          Los asuntos archivados aparecerán aquí.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {casos.map(caso => (
                      <motion.tr
                        key={String(caso._id)}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.1 }}
                        className="border-b border-[#a8dbde]/40 last:border-0 hover:bg-brand-accent/20 transition-colors duration-100 h-12"
                      >
                        <td className="px-4 py-3 text-brand-text/60">{caso.nombre}</td>
                        <td className="px-4 py-3 text-brand-text/60">{formatDate(caso.fechaIngreso)}</td>
                        <td className="px-4 py-3 text-brand-text/60">{formatDate(caso.fechaVencimiento)}</td>
                        <td className="px-4 py-3 text-brand-text/60">{caso.responsable}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRestore(String(caso._id))}
                              title="Restaurar asunto"
                              aria-label={`Restaurar asunto ${caso.nombre}`}
                              className="p-1.5 rounded-lg hover:bg-brand-accent/30 transition-colors duration-150 cursor-pointer"
                            >
                              <ArchiveRestore size={15} className="text-brand-title/60" />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(String(caso._id), caso.nombre)}
                              title="Eliminar asunto"
                              aria-label={`Eliminar asunto ${caso.nombre}`}
                              className="p-1.5 rounded-lg hover:bg-brand-accent/30 transition-colors duration-150 cursor-pointer"
                            >
                              <Trash2 size={15} className="text-brand-title/60" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {pendingDelete && (
        <ConfirmDialog
          open={confirmOpen}
          casoNombre={pendingDelete.nombre}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setConfirmOpen(false); setPendingDelete(null) }}
        />
      )}
    </div>
  )
}
