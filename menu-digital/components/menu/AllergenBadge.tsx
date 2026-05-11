import { ALLERGENS } from '@/lib/allergens'
import { AllergenIcon } from '@/components/menu/AllergenIcon'
import type { AllergenKey } from '@/lib/allergens'

interface Props {
  allergenKey: AllergenKey
}

export function AllergenBadge({ allergenKey }: Props) {
  const allergen = ALLERGENS.find(a => a.key === allergenKey)
  const label = allergen?.label ?? allergenKey

  return (
    <span
      className="relative group/badge"
      role="img"
      aria-label={label}
      tabIndex={0}
    >
      <span className="flex items-center justify-center w-5 h-5 text-brand-texto/40 select-none cursor-default">
        <AllergenIcon allergenKey={allergenKey} size={13} />
      </span>
      <span
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-brand-titulares text-white text-sm font-normal rounded whitespace-nowrap opacity-0 group-hover/badge:opacity-100 group-focus-within/badge:opacity-100 pointer-events-none transition-opacity duration-150 z-20"
        aria-hidden="true"
      >
        {label}
      </span>
    </span>
  )
}
