import type { AllergenKey } from '@/lib/allergens'

interface Props {
  allergenKey: AllergenKey
  size?: number
}

export function AllergenIcon({ allergenKey, size = 14 }: Props) {
  const svg = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (allergenKey) {
    // Gluten — espiga de trigo
    case 'gluten':
      return (
        <svg {...svg}>
          <line x1="8" y1="15" x2="8" y2="2" />
          <path d="M8 12C6.5 11 5 9 5.5 7.5C6 6 8 6.5 8 8" />
          <path d="M8 12C9.5 11 11 9 10.5 7.5C10 6 8 6.5 8 8" />
          <path d="M8 8.5C6.5 7.5 5 5.5 5.5 4C6 2.5 8 3 8 4.5" />
          <path d="M8 8.5C9.5 7.5 11 5.5 10.5 4C10 2.5 8 3 8 4.5" />
        </svg>
      )

    // Crustáceos — camarón
    case 'crustaceos':
      return (
        <svg {...svg}>
          <path d="M11 3C11 3 13 4 13 6C13 9 10 11 8 11C6 11 4 10 4 8C4 6 6 5 7 6C8 7 7 9 9 9C11 9 12 7 11 5" />
          <path d="M4 8L2 9" />
          <path d="M4.5 10L3 12" />
          <path d="M11 3L12 1" />
          <path d="M13 4L15 3" />
          <circle cx="11" cy="3" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      )

    // Huevos — huevo
    case 'huevos':
      return (
        <svg {...svg}>
          <path d="M8 2C5.5 2 3 5 3 8.5C3 12 5.2 14 8 14C10.8 14 13 12 13 8.5C13 5 10.5 2 8 2Z" />
        </svg>
      )

    // Pescado — pez
    case 'pescado':
      return (
        <svg {...svg}>
          <path d="M2 8C4 5 7 4 10 5C12 5.5 13.5 7 13.5 8C13.5 9 12 10.5 10 11C7 12 4 11 2 8Z" />
          <path d="M13.5 5L15.5 8L13.5 11" />
          <circle cx="6.5" cy="7" r="1" fill="currentColor" stroke="none" />
        </svg>
      )

    // Cacahuetes — maní (forma de cáscara)
    case 'cacahuetes':
      return (
        <svg {...svg}>
          <path d="M5 4.5C3.5 4.5 2.5 5.5 2.5 7C2.5 8.5 3.5 9.5 5 9.5C5.5 9.5 6 9.3 6.5 9" />
          <path d="M11 4.5C12.5 4.5 13.5 5.5 13.5 7C13.5 8.5 12.5 9.5 11 9.5C10.5 9.5 10 9.3 9.5 9" />
          <path d="M6.5 9C7 9.5 7 10.5 7.5 11C8 11.5 8.5 11.5 9 11C9.5 10.5 9.5 9.5 9.5 9" />
          <path d="M6.5 5C7 4.5 7 3.5 7.5 3C8 2.5 8.5 2.5 9 3C9.5 3.5 9.5 4.5 9.5 5" />
          <line x1="6" y1="7" x2="10" y2="7" strokeDasharray="1 1" />
        </svg>
      )

    // Soja — vaina de soja
    case 'soja':
      return (
        <svg {...svg}>
          <path d="M8 14L8 9" />
          <path d="M8 9C8 9 6 8 5 6C4 4 5 2 7 2C9 2 10 3 9.5 5C9 7 8 9 8 9Z" />
          <path d="M8 11C8 11 10 10.5 11 9C12 7.5 11 5.5 9.5 6C8 6.5 8 8 8 9" />
          <circle cx="6.5" cy="5" r="1" fill="currentColor" stroke="none" />
          <circle cx="9" cy="8" r="1" fill="currentColor" stroke="none" />
        </svg>
      )

    // Lácteos — gota de leche
    case 'lacteos':
      return (
        <svg {...svg}>
          <path d="M8 2L5 8C4 10 4.5 12.5 8 13.5C11.5 12.5 12 10 11 8L8 2Z" />
          <path d="M6 9.5C6 9.5 6.5 11.5 8 12" strokeWidth="1" />
        </svg>
      )

    // Frutos de cáscara — avellana con tallo
    case 'frutos_de_cascara':
      return (
        <svg {...svg}>
          <path d="M5.5 9C5.5 6 6.5 4 8 4C9.5 4 10.5 6 10.5 9C10.5 11.5 9.5 13.5 8 13.5C6.5 13.5 5.5 11.5 5.5 9Z" />
          <path d="M5 8C5 5.5 6 3.5 8 3.5C10 3.5 11 5.5 11 8" />
          <line x1="8" y1="3.5" x2="8" y2="1.5" />
          <path d="M6.5 1.5C6.5 1 7.2 0.5 8 0.5C8.8 0.5 9.5 1 9.5 1.5" />
        </svg>
      )

    // Apio — manojo de tallos
    case 'apio':
      return (
        <svg {...svg}>
          <path d="M8 15L8 8C8 6 8.5 3 10 2" />
          <path d="M8 15L8 9C8 7 7 4 5.5 3" />
          <path d="M8 15L9.5 9C10 7 12 6 13 5" />
          <path d="M8 15L6.5 9C6 7 4 6 3 5" />
          <path d="M6 3.5C6.5 2 7.5 1.5 8 2" />
          <path d="M10 2C10.5 1 11.5 1 12 1.5" />
        </svg>
      )

    // Mostaza — flores de mostaza (puntos en rama)
    case 'mostaza':
      return (
        <svg {...svg}>
          <line x1="8" y1="15" x2="8" y2="7" />
          <line x1="8" y1="11" x2="5.5" y2="9" />
          <line x1="8" y1="9" x2="10.5" y2="7" />
          <circle cx="5.5" cy="9" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="10.5" cy="7" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="8" cy="5.5" r="1.8" fill="currentColor" stroke="none" />
        </svg>
      )

    // Sésamo — vaina de sésamo con semillas
    case 'sesamo':
      return (
        <svg {...svg}>
          <path d="M6 2C5 2 4.5 4 4.5 8C4.5 12 5 14 6 14C6.5 14 7 13 7.5 13C8 13 8.5 14 9 14C10 14 11 12 11 8C11 4 10.5 2 9.5 2C9 2 8.5 3 8 3C7.5 3 7 2 6 2Z" />
          <ellipse cx="7.7" cy="5.5" rx="1" ry="0.6" fill="currentColor" stroke="none" />
          <ellipse cx="7.7" cy="8" rx="1" ry="0.6" fill="currentColor" stroke="none" />
          <ellipse cx="7.7" cy="10.5" rx="1" ry="0.6" fill="currentColor" stroke="none" />
        </svg>
      )

    // Dióxido de azufre — copa de vino
    case 'dioxido_de_azufre':
      return (
        <svg {...svg}>
          <path d="M4.5 2L11.5 2L10 7.5C10 9.5 9 11 8 11C7 11 6 9.5 6 7.5L4.5 2Z" />
          <line x1="8" y1="11" x2="8" y2="14" />
          <line x1="5" y1="14" x2="11" y2="14" />
        </svg>
      )

    // Altramuces — flor de altramuz
    case 'altramuces':
      return (
        <svg {...svg}>
          <line x1="8" y1="15" x2="8" y2="8" />
          <ellipse cx="8" cy="6" rx="2" ry="3" />
          <ellipse cx="4.5" cy="8" rx="1.5" ry="2.5" transform="rotate(-30 4.5 8)" />
          <ellipse cx="11.5" cy="8" rx="1.5" ry="2.5" transform="rotate(30 11.5 8)" />
          <ellipse cx="3" cy="11" rx="1.5" ry="2" transform="rotate(-15 3 11)" />
          <ellipse cx="13" cy="11" rx="1.5" ry="2" transform="rotate(15 13 11)" />
        </svg>
      )

    // Moluscos — concha de almeja
    case 'moluscos':
      return (
        <svg {...svg}>
          <path d="M3 10C3 7 5 4.5 8 4.5C11 4.5 13 7 13 10" />
          <path d="M3 10C3 12 5.5 13.5 8 13.5C10.5 13.5 13 12 13 10" />
          <line x1="8" y1="4.5" x2="8" y2="13.5" />
          <path d="M5.5 6C5 8 5.5 11 8 12.5" strokeWidth="1" />
          <path d="M10.5 6C11 8 10.5 11 8 12.5" strokeWidth="1" />
        </svg>
      )

    default:
      return (
        <svg {...svg}>
          <circle cx="8" cy="8" r="5.5" />
          <line x1="8" y1="5" x2="8" y2="8.5" />
          <circle cx="8" cy="11" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      )
  }
}
