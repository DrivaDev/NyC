"use client"

import { ChevronUp, ChevronDown } from "lucide-react"

interface CasosFilterBarProps {
  filterNombre: string
  filterResponsable: string
  onNombreChange: (v: string) => void
  onResponsableChange: (v: string) => void
  sortDir: "asc" | "desc"
  onSortToggle: () => void
}

export function CasosFilterBar({
  filterNombre,
  filterResponsable,
  onNombreChange,
  onResponsableChange,
  sortDir,
  onSortToggle,
}: CasosFilterBarProps) {
  const inputClass = "w-full max-w-[220px] border border-[#a8dbde] rounded-lg px-3 py-2 text-[13px] bg-white text-brand-text placeholder:text-brand-text/40 outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50"

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap items-center">
      <input
        type="text"
        value={filterNombre}
        onChange={e => onNombreChange(e.target.value)}
        placeholder="Buscar por nombre..."
        className={inputClass}
        aria-label="Filtrar por nombre"
      />
      <input
        type="text"
        value={filterResponsable}
        onChange={e => onResponsableChange(e.target.value)}
        placeholder="Buscar por responsable..."
        className={inputClass}
        aria-label="Filtrar por responsable"
      />
      <button
        onClick={onSortToggle}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#a8dbde] bg-white text-[13px] text-brand-title hover:bg-brand-accent/20 transition-colors duration-150 whitespace-nowrap"
        aria-label={`Ordenar por vencimiento ${sortDir === "asc" ? "descendente" : "ascendente"}`}
      >
        {sortDir === "asc"
          ? <><ChevronUp size={14} className="text-brand-primary" /> Venc. más próximo</>
          : <><ChevronDown size={14} className="text-brand-primary" /> Venc. más lejano</>
        }
      </button>
    </div>
  )
}
