"use client"

import { motion, AnimatePresence } from "motion/react"
import Link from "next/link"
import { Trash2, Pencil, Archive, Briefcase, SearchX } from "lucide-react"

interface CasoRow {
  _id: string
  nombre: string
  fechaIngreso: string | Date
  fechaVencimiento: string | Date
  responsable: string
}

interface CasosTableProps {
  casos: CasoRow[]
  onDeleteRequest: (id: string, nombre: string) => void
  onArchiveRequest: (id: string, nombre: string) => void
  loading: boolean
  hasActiveFilter: boolean
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

export function CasosTable({
  casos,
  onDeleteRequest,
  onArchiveRequest,
  loading,
  hasActiveFilter,
}: CasosTableProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-brand-accent/30 animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
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
            <th className="text-left px-4 py-3 text-[13px] font-normal text-brand-title whitespace-nowrap overflow-hidden text-ellipsis">
              Nombre
            </th>
            <th className="text-left px-4 py-3 text-[13px] font-normal text-brand-title whitespace-nowrap">
              Fecha de ingreso
            </th>
            <th className="text-left px-4 py-3 text-[13px] font-normal text-brand-title whitespace-nowrap">
              Fecha de vencimiento
            </th>
            <th className="text-left px-4 py-3 text-[13px] font-normal text-brand-title whitespace-nowrap overflow-hidden text-ellipsis">
              Responsable
            </th>
            <th className="text-left px-4 py-3 text-[13px] font-normal text-brand-title whitespace-nowrap">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {casos.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  {hasActiveFilter ? (
                    <>
                      <SearchX size={32} className="text-brand-accent" />
                      <p className="text-[16px] font-normal text-brand-title">Sin resultados</p>
                      <p className="text-[13px] text-brand-text/60 text-center">
                        Ningún asunto coincide con los filtros aplicados.
                      </p>
                    </>
                  ) : (
                    <>
                      <Briefcase size={32} className="text-brand-accent" />
                      <p className="text-[16px] font-normal text-brand-title">Sin asuntos registrados</p>
                      <p className="text-[13px] text-brand-text/60 text-center">
                        Creá el primer asunto desde el botón &ldquo;Nuevo asunto&rdquo;.
                      </p>
                    </>
                  )}
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
                  <td className="px-4 py-3">{caso.nombre}</td>
                  <td className="px-4 py-3">{formatDate(caso.fechaIngreso)}</td>
                  <td className="px-4 py-3">{formatDate(caso.fechaVencimiento)}</td>
                  <td className="px-4 py-3">{caso.responsable}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/casos/editar/${caso._id}`}
                        title="Editar asunto"
                        aria-label={`Editar asunto ${caso.nombre}`}
                        className="p-1.5 rounded-lg hover:bg-brand-accent/30 transition-colors duration-150 cursor-pointer"
                      >
                        <Pencil size={15} className="text-brand-title/60" />
                      </Link>
                      <button
                        onClick={() => onArchiveRequest(String(caso._id), caso.nombre)}
                        title="Archivar asunto"
                        aria-label={`Archivar asunto ${caso.nombre}`}
                        className="p-1.5 rounded-lg hover:bg-brand-accent/30 transition-colors duration-150 cursor-pointer"
                      >
                        <Archive size={15} className="text-brand-title/60" />
                      </button>
                      <button
                        onClick={() => onDeleteRequest(String(caso._id), caso.nombre)}
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
  )
}
