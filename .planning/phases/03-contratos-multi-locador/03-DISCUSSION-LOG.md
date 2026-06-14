# Phase 3: Contratos — Multi-locador - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 3-Contratos-Multi-locador
**Areas discussed:** UI para multi-locador, Datos por locador (AC), Texto plural en Adenda, Límite y alcance

---

## UI para multi-locador

| Option | Description | Selected |
|--------|-------------|----------|
| Botones +/− en paso 2 | Sección "Locadores" con botón "Agregar locador" en paso de Documentación | ✓ |
| Campo numérico "¿Cuántos locadores?" | Selector antes del formulario | |
| Checkbox "+ Agregar otro locador" | Checkbox al final que expande sección adicional | |

**User's choice:** Botones +/− en paso 2

---

| Option | Description | Selected |
|--------|-------------|----------|
| Todos los modelos (AC + Adenda) | Opción multi-locador en cualquier contrato | ✓ |
| Solo Anexo AC | Solo donde se clona filas de tabla | |
| Me parece bien que Claude decida | Basado en requirements | |

**User's choice:** Todos los modelos (AC + Adenda)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sección colapsable por locador con sus docs | Cada locador tiene su propio campo de archivos, expandible | ✓ |
| Un solo campo compartido para todos | Gemini identifica a cada persona | |
| Campos de texto estructurados | El usuario tipea nombre, CUIT, etc. | |

**User's choice:** Sección colapsable por locador con sus docs

---

## Datos por locador (AC — CONTR-11)

| Option | Description | Selected |
|--------|-------------|----------|
| Docs separados — una llamada a Gemini por locador | N llamadas, una por locador, cada fila completada con su llamada | ✓ |
| Todos los docs juntos — una sola llamada | Gemini identifica cada locador | |
| Me parece bien que Claude decida | | |

**User's choice:** Docs separados — una llamada a Gemini por locador

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sí — tiene etiqueta identificable | El sistema busca texto conocido en XML | |
| No sé / no recuerdo el template | Claude inspecciona el XML del template real | ✓ |

**User's choice:** No sé / no recuerdo el template — el agente de planeación debe inspeccionar `tma/templates/AC PF.docx`

---

## Texto plural en Adenda (CONTR-12)

| Option | Description | Selected |
|--------|-------------|----------|
| Solo 'el LOCADOR' y 'El LOCADOR' | Solo nominativos, no preposicionales | ✓ |
| También variantes preposicionales | del/al LOCADOR → de los/a los LOCADORES | |
| Revisar templates primero | Inspeccionar los 8 templates antes de decidir | |

**User's choice:** Solo "el LOCADOR" → "los LOCADORES" y "El LOCADOR" → "Los LOCADORES"

---

| Option | Description | Selected |
|--------|-------------|----------|
| Antes de Gemini | Modificar XML primero, luego extraer y llamar Gemini | ✓ |
| Después de Gemini | Gemini completa primero, luego reemplazo | |

**User's choice:** Antes de Gemini

---

## Límite y alcance

| Option | Description | Selected |
|--------|-------------|----------|
| Máximo 4 locadores | El wizard limita el botón '+' | |
| Sin límite fijo | Usuario decide cuántos | ✓ |
| Máximo 2 locadores | Solo el caso más común | |

**User's choice:** Sin límite fijo — el usuario puede agregar tantos locadores como quiera

---

| Option | Description | Selected |
|--------|-------------|----------|
| Una sola llamada con toda la info | Para Adenda — todos los docs concatenados | ✓ |
| N llamadas, una por locador | Consistente con AC pero más costoso | |

**User's choice:** Una sola llamada a Gemini con todos los docs para Adenda

---

## Claude's Discretion

- Mecanismo de ID único para placeholders de filas clonadas
- Acordeón vs sección siempre visible en el wizard
- Nombre de la función de clonado en fillPlaceholders.ts
- Llamadas a Gemini en AC en paralelo (Promise.all) o secuencial

## Deferred Ideas

- Historial de contratos generados — v2 (CONTR-V2-01)
- Preview interactivo con edición de campos de locador post-generación — no en v1
