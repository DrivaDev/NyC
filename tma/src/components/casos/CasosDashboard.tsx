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

interface CasosDashboardProps {
  initialCasos?: CasoData[]
}

export function CasosDashboard({ initialCasos }: CasosDashboardProps = {}) {
  const [casos, setCasos] = useState<CasoData[]>(initialCasos ?? [])
  const [loading, setLoading] = useState(!initialCasos)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filterNombre, setFilterNombre] = useState("")
  const [filterResponsable, setFilterResponsable] = useState("")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; nombre: string } | null>(null)

  useEffect(() => {
    if (initialCasos) return // server already provided data
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

  const filteredCasos = casos.filter(c =>
    c.nombre.toLowerCase().includes(filterNombre.toLowerCase()) &&
    c.responsable.toLowerCase().includes(filterResponsable.toLowerCase())
  )

  const sortedCasos = [...filteredCasos].sort((a, b) =>
    sortDir === "asc"
      ? new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
      : new Date(b.fechaVencimiento).getTime() - new Date(a.fechaVencimiento).getTime()
  )

  const handleDeleteRequest = (id: string, nombre: string) => {
    setPendingDelete({ id, nombre })
    setConfirmOpen(true)
    setDeleteError(null)
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
        setDeleteError("No se pudo eliminar el asunto. Intentá nuevamente.")
      }
    } catch {
      setCasos(backup)
      setDeleteError("No se pudo eliminar el asunto. Intentá nuevamente.")
    }

    setPendingDelete(null)
  }

  const handleArchiveRequest = async (id: string) => {
    const backup = [...casos]
    setCasos(prev => prev.filter(c => String(c._id) !== id))

    try {
      const res = await fetch(`/api/casos?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivado: true }),
      })
      if (!res.ok) {
        setCasos(backup)
        setDeleteError("No se pudo archivar el asunto. Intentá nuevamente.")
      }
    } catch {
      setCasos(backup)
      setDeleteError("No se pudo archivar el asunto. Intentá nuevamente.")
    }
  }

  const hasActiveFilter = filterNombre.trim() !== "" || filterResponsable.trim() !== ""

  return (
    <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
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

          {loadError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700">
              {loadError}
            </div>
          )}

          {deleteError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700">
              {deleteError}
            </div>
          )}

          <CasosFilterBar
            filterNombre={filterNombre}
            filterResponsable={filterResponsable}
            onNombreChange={setFilterNombre}
            onResponsableChange={setFilterResponsable}
            sortDir={sortDir}
            onSortToggle={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
          />

          <CasosTable
            casos={sortedCasos}
            onDeleteRequest={handleDeleteRequest}
            onArchiveRequest={handleArchiveRequest}
            loading={loading}
            hasActiveFilter={hasActiveFilter}
          />
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
