"use client"

interface CasosFilterBarProps {
  filterNombre: string
  filterResponsable: string
  onNombreChange: (v: string) => void
  onResponsableChange: (v: string) => void
}

export function CasosFilterBar({
  filterNombre,
  filterResponsable,
  onNombreChange,
  onResponsableChange,
}: CasosFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <input
        type="text"
        value={filterNombre}
        onChange={e => onNombreChange(e.target.value)}
        placeholder="Buscar por nombre..."
        className="w-full max-w-[220px] border border-[#FECBA1] rounded-lg px-3 py-2 text-[13px]
                   bg-white text-brand-text placeholder:text-brand-text/40
                   outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50"
        aria-label="Filtrar por nombre"
      />
      <input
        type="text"
        value={filterResponsable}
        onChange={e => onResponsableChange(e.target.value)}
        placeholder="Buscar por responsable..."
        className="w-full max-w-[220px] border border-[#FECBA1] rounded-lg px-3 py-2 text-[13px]
                   bg-white text-brand-text placeholder:text-brand-text/40
                   outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50"
        aria-label="Filtrar por responsable"
      />
    </div>
  )
}
