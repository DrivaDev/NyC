export const ALLERGENS = [
  { key: 'gluten',              label: 'Gluten' },
  { key: 'crustaceos',          label: 'Crustáceos' },
  { key: 'huevos',              label: 'Huevos' },
  { key: 'pescado',             label: 'Pescado' },
  { key: 'cacahuetes',          label: 'Cacahuetes' },
  { key: 'soja',                label: 'Soja' },
  { key: 'lacteos',             label: 'Lácteos' },
  { key: 'frutos_de_cascara',   label: 'Frutos de cáscara' },
  { key: 'apio',                label: 'Apio' },
  { key: 'mostaza',             label: 'Mostaza' },
  { key: 'sesamo',              label: 'Sésamo' },
  { key: 'dioxido_de_azufre',   label: 'Dióxido de azufre' },
  { key: 'altramuces',          label: 'Altramuces' },
  { key: 'moluscos',            label: 'Moluscos' },
] as const

export type AllergenKey = typeof ALLERGENS[number]['key']
