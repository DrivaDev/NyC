# Phase 2: Contratos — Pipeline de generación - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 02-Contratos-Pipeline-Generacion
**Areas discussed:** Los 10 modelos, Estado de procesamiento, Errores de Gemini

---

## Los 10 modelos

### Presentación de modelos (pantalla de selección)

| Option | Description | Selected |
|--------|-------------|----------|
| Lista agrupada por tipo | Grupos con scroll vertical simple | |
| Grid de cards agrupadas por tipo | Cards en grid, agrupadas por categoría | ✓ |

**User's choice:** Grid de cards, agrupadas por tipo.

---

### Placeholder en AC PF / AC PJ (hallazgo técnico)

| Option | Description | Selected |
|--------|-------------|----------|
| Gemini completa por contexto | Identifica campos por etiquetas en XML, Gemini completa sin IDs de runs | ✓ |
| Campos predefinidos fijos | Lista hardcodeada de campos AC | |

**User's choice:** Gemini completa por contexto.
**Notes:** Hallazgo durante análisis: AC PF/PJ no tienen `<w:highlight w:val="yellow"/>`. Son formularios de certificado anticorrupción con campos como "Nombre:", "CUIT:", "Domicilio:". El pipeline de los 8 Adenda sigue usando amarillo normalmente.

---

### Campo "información del sitio" en Adenda

| Option | Description | Selected |
|--------|-------------|----------|
| Fotos del sitio (jpg/png) + contrato anterior (pdf/docx) | Campo multiformato unificado | ✓ |
| Un solo campo 'documentación del sitio' | Todo mezclado | (equivalente) |
| No sé exactamente | Dejar al planner | |

**User's choice:** Fotos del sitio (jpg/png) + contrato anterior (pdf/docx) en un mismo campo multiformato.

---

## Estado de procesamiento

### Experiencia durante espera (~10-60s)

| Option | Description | Selected |
|--------|-------------|----------|
| Spinner + mensaje fijo | "Generando contrato..." simple | |
| Mensajes secuenciales animados | Secuencia de pasos animada | ✓ |
| Barra de progreso con timer | Estimación de tiempo | |

**User's choice:** Mensajes secuenciales animados.

---

### Detalle post-procesamiento

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, resumen post-procesamiento | "Se completaron X/N campos. Y vacíos." antes de descarga | ✓ |
| No, ir directo a descarga | Sin resumen | |

**User's choice:** Sí, resumen post-procesamiento.

---

## Errores de Gemini

### Manejo de fallo

| Option | Description | Selected |
|--------|-------------|----------|
| Mensaje de error + botón Reintentar | "Hubo un error... Intentá de nuevo." + reintentar | ✓ |
| Mensaje de error + volver al paso 2 | Error manda al formulario | |
| Error silencioso — descargar con campos vacíos | Descarga sin completar | |

**User's choice:** Mensaje de error + botón Reintentar (Recomendado).

---

### Archivos en reintento

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, mismos archivos | Archivos en estado cliente — no resubir | ✓ |
| No, resubir siempre | Por simplicidad cada intento requiere resubida | |

**User's choice:** Sí, mismos archivos mantenidos en estado cliente.

---

## Claude's Discretion

- Slugs/IDs internos para mapear nombre de modelo → archivo template
- Estructura exacta del prompt enviado a Gemini (respetando CONTR-08/09)
- Arquitectura interna del wizard (Server + Client split)

## Deferred Ideas

- Multi-locador (clonado de filas AC, adaptación plural Adenda) → Phase 3 (CONTR-11, CONTR-12)
- Historial de contratos generados → v2 (CONTR-V2-01)
