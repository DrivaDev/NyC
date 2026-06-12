export type ContractType = "ac" | "adenda"

export interface ContractModel {
  id: string          // kebab-case slug used as FormData modelId
  filename: string    // exact filename in public/templates/
  type: ContractType  // determines which placeholder extraction + form strategy to use
  label: string       // display name in UI
  group: string       // group header text for Step 1 grid
  description: string // card description text
}

export const MODELS: ContractModel[] = [
  // Group: Anexo AC
  {
    id: "ac-pf",
    filename: "AC PF.docx",
    type: "ac",
    label: "AC Persona Física",
    group: "Anexo AC",
    description: "Persona Física",
  },
  {
    id: "ac-pj",
    filename: "AC PJ.docx",
    type: "ac",
    label: "AC Persona Jurídica",
    group: "Anexo AC",
    description: "Persona Jurídica",
  },
  // Group: Adenda Carta Oferta
  {
    id: "adenda-carta-oferta-pf-pesos",
    filename: "Adenda de Extensión de Plazo – Carta Oferta - PF en PESOS.docx",
    type: "adenda",
    label: "PF en PESOS",
    group: "Adenda Carta Oferta",
    description: "Persona Física · Pesos",
  },
  {
    id: "adenda-carta-oferta-pf-usd",
    filename: "Adenda de Extensión de Plazo – Carta Oferta - PF en USD.docx",
    type: "adenda",
    label: "PF en USD",
    group: "Adenda Carta Oferta",
    description: "Persona Física · Dólares",
  },
  {
    id: "adenda-carta-oferta-pj-pesos",
    filename: "Adenda de Extensión de Plazo – Carta Oferta - PJ en PESOS.docx",
    type: "adenda",
    label: "PJ en PESOS",
    group: "Adenda Carta Oferta",
    description: "Persona Jurídica · Pesos",
  },
  {
    id: "adenda-carta-oferta-pj-usd",
    filename: "Adenda de Extensión de Plazo – Carta Oferta - PJ en USD.docx",
    type: "adenda",
    label: "PJ en USD",
    group: "Adenda Carta Oferta",
    description: "Persona Jurídica · Dólares",
  },
  // Group: Adenda Contrato Tradicional
  {
    id: "adenda-contrato-tradicional-pf-pesos",
    filename: "Adenda de Extensión de Plazo - Contrato Tradicional -PF en PESOS.docx",
    type: "adenda",
    label: "PF en PESOS",
    group: "Adenda Contrato Tradicional",
    description: "Persona Física · Pesos",
  },
  {
    id: "adenda-contrato-tradicional-pf-usd",
    filename: "Adenda de Extensión de Plazo - Contrato Tradicional - PF en USD.docx",
    type: "adenda",
    label: "PF en USD",
    group: "Adenda Contrato Tradicional",
    description: "Persona Física · Dólares",
  },
  {
    id: "adenda-contrato-tradicional-pj-pesos",
    filename: "Adenda de Extensión de Plazo - Contrato Tradicional - PJ en PESOS.docx",
    type: "adenda",
    label: "PJ en PESOS",
    group: "Adenda Contrato Tradicional",
    description: "Persona Jurídica · Pesos",
  },
  {
    id: "adenda-contrato-tradicional-pj-usd",
    filename: "Adenda de Extensión de Plazo - Contrato Tradicional - PJ en USD.docx",
    type: "adenda",
    label: "PJ en USD",
    group: "Adenda Contrato Tradicional",
    description: "Persona Jurídica · Dólares",
  },
]

// Build a Map<id, ContractModel> for O(1) lookup in the Route Handler
const MODELS_MAP = new Map<string, ContractModel>(MODELS.map(m => [m.id, m]))

/**
 * Returns the ContractModel for the given id, or undefined if not found.
 * Used in the Route Handler to validate modelId and prevent path traversal.
 */
export function getModelById(id: string): ContractModel | undefined {
  return MODELS_MAP.get(id)
}

/**
 * Returns models grouped by their `group` property.
 * Used in ContratoWizard Step 1 to render the 3-section grid.
 */
export function getModelsByGroup(): Map<string, ContractModel[]> {
  const groups = new Map<string, ContractModel[]>()
  for (const model of MODELS) {
    if (!groups.has(model.group)) groups.set(model.group, [])
    groups.get(model.group)!.push(model)
  }
  return groups
}
