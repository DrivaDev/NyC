"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { CasosFilterBar } from "./CasosFilterBar"
import { CasosTable } from "./CasosTable"
import { ConfirmDialog } from "./ConfirmDialog"

interface CasoData {
  _id: string
  nombre: string
  fechaIngreso: string | Date
  fechaVencimiento: string | Date
  responsable: string
}

export function CasosDashboard() {
  const [casos, setCasos] = useState<CasoData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filterNombre, setFilterNombre] = useState("")
  const [filterResponsable, setFilterResponsable] = useState("")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; nombre: string } | null>(null)

  // Fetch inicial de asuntos (D-07: todos se cargan al montar, filtrado en memoria)
  useEffect(() => {
    fetch("/api/casos")
      .then(r => {
        if (!r.ok) throw new Error("Error al cargar")
        return r.json()
      })
      .then((data: CasoData[]) => {
        setCasos(data)
        setLoading(false)
      })
      .catch(() => {
        setLoadError("No se pudieron cargar los asuntos. Recargá la página.")
        setLoading(false)
      })
  }, [])

  // Filtrado AND (D-06, D-07, D-09) — sobre el array original, no paginado
  const filteredCasos = casos.filter(c =>
    c.nombre.toLowerCase().includes(filterNombre.toLowerCase()) &&
    c.responsable.toLowerCase().includes(filterResponsable.toLowerCase())
  )

  // Ordenamiento por fechaVencimiento (D-08) — después del filtrado
  const sortedCasos = [...filteredCasos].sort((a, b) =>
    sortDir === "asc"
      ? new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
      : new Date(b.fechaVencimiento).getTime() - new Date(a.fechaVencimiento).getTime()
  )

  // Solicitar confirmación de eliminación (D-10)
  const handleDeleteRequest = (id: string, nombre: string) => {
    setPendingDelete({ id, nombre })
    setConfirmOpen(true)
    setDeleteError(null)
  }

  // Confirmar eliminación con UI optimista (D-11)
  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setConfirmOpen(false)

    const backup = [...casos]
    // 1. UI optimista: eliminar inmediatamente del estado local
    setCasos(prev => prev.filter(c => String(c._id) !== id))

    // 2. Llamada al servidor
    try {
      const res = await fetch(`/api/casos?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        // 3. Rollback si el servidor responde con error (D-11)
        setCasos(backup)
        setDeleteError("No se pudo eliminar el asunto. Intentá nuevamente.")
      }
    } catch {
      setCasos(backup)
      setDeleteError("No se pudo eliminar el asunto. Intentá nuevamente.")
    }

    setPendingDelete(null)
  }

  const hasActiveFilter = filterNombre.trim() !== "" || filterResponsable.trim() !== ""

  return (
    <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h1 className="text-[28px] font-bold text-brand-title">Asuntos</h1>
            <Link
              href="/casos/nuevo"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-[13px] font-normal hover:bg-brand-primary/90 transition-colors duration-150"
            >
              <PlusCircle size={16} />
              Nuevo asunto
            </Link>
          </div>

          {/* Error de carga */}
          {loadError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700">
              {loadError}
            </div>
          )}

          {/* Error de eliminación */}
          {deleteError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700">
              {deleteError}
            </div>
          )}

          {/* Filtros + ordenamiento */}
          <CasosFilterBar
            filterNombre={filterNombre}
            filterResponsable={filterResponsable}
            onNombreChange={setFilterNombre}
            onResponsableChange={setFilterResponsable}
            sortDir={sortDir}
            onSortToggle={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
          />

          {/* Tabla */}
          <CasosTable
            casos={sortedCasos}
            onDeleteRequest={handleDeleteRequest}
            loading={loading}
            hasActiveFilter={hasActiveFilter}
          />
        </motion.div>

      {/* Dialog de confirmación (D-10) */}
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
