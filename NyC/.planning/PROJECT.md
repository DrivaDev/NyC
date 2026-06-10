# TMA — App interna Nicholson & Cano

## What This Is

Herramienta web interna para el estudio jurídico Nicholson & Cano (NyC), desarrollada por Driva Dev. Tiene dos módulos: gestión de asuntos (Casos TMA) con dashboard, filtros y estadísticas; y generador de contratos (Contratos TMA) que usa IA (Gemini) para completar automáticamente campos resaltados en amarillo en plantillas .docx a partir de documentación subida por el usuario. Acceso restringido a 5 emails de NyC.

## Core Value

El usuario puede cargar documentación de un asunto y obtener un .docx de contrato correctamente completado en segundos, sin escribir datos manualmente.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Autenticación con allowlist de emails — solo 5 usuarios de NyC pueden registrarse
- [ ] Dashboard de asuntos con tabla filtrable (nombre, vencimiento, responsable)
- [ ] CRUD de asuntos: crear, listar, eliminar
- [ ] Estadísticas de asuntos: selector de período + gráfico de barras mensual (Recharts)
- [ ] Flujo de generación de contratos: selección de modelo → carga de docs → procesamiento Gemini → descarga .docx
- [ ] 10 plantillas .docx con campos resaltados en amarillo (`<w:highlight w:val="yellow"/>`)
- [ ] Manipulación directa de XML (pizzip) sin docxtemplater
- [ ] Lógica multi-locador: row cloning en Anexo AC, adaptación plural en otros modelos
- [ ] UI con identidad visual Driva Dev (paleta naranja/crema, Poppins)
- [ ] Footer "Desarrollado por Driva Dev" en todas las páginas

### Out of Scope

- OAuth / login social — allowlist pequeña hace innecesario OAuth; Credentials Provider suficiente
- Almacenamiento permanente de archivos subidos — costo $0 requiere procesamiento en memoria
- Notificaciones o recordatorios de vencimiento — no solicitado en v1
- Roles y permisos diferenciados — todos los 5 usuarios tienen acceso completo
- Edición de asuntos — crear + eliminar es suficiente para v1 (no solicitado)

## Context

- Cliente: Nicholson & Cano, estudio jurídico. Usuarios finales son abogados/personal.
- Desarrollador: Driva Dev (DrivaDev en GitHub). App no es pública.
- Las plantillas .docx reales serán colocadas manualmente en `/templates` después del desarrollo. Durante desarrollo se trabaja con la estructura esperada.
- Los campos a completar en los .docx son `<w:r>` runs con `<w:highlight w:val="yellow"/>` en su `<w:rPr>`. No hay sintaxis de plantilla — Gemini lee los docs del usuario y completa directamente.
- Multi-locador: si hay 2+ locadores en los docs subidos, Gemini lo detecta. Para Anexo AC se clona el `<w:tr>` de identificación N-1 veces. Para otros modelos se adapta el texto (singular→plural) sin alterar estructura.
- Procesamiento de archivos subidos: docx→mammoth, pdf→pdf-parse, imágenes→Gemini Vision inline base64.

## Constraints

- **Stack**: Next.js 15 App Router + TypeScript + Tailwind CSS — definido por cliente
- **Auth**: NextAuth.js v5, Credentials Provider + bcrypt — NO OAuth, NO magic links
- **DB**: MongoDB Atlas M0 (free tier) — costo $0
- **IA**: Gemini `gemini-2.0-flash` free tier — minimizar tokens enviados
- **Hosting**: Vercel Hobby — `maxDuration: 60` en route de contratos
- **Budget**: $0 — todos los servicios en tier gratuito
- **Storage**: Cero almacenamiento de archivos — todo en memoria dentro de la request
- **Usuarios**: Allowlist fija de 5 emails: nsilva@nyc.com.ar, crivera@nyc.com.ar, tderosa@nyc.com.ar, vespinola@nyc.com.ar, ekoch@nyc.com.ar

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| pizzip + XML directo en vez de docxtemplater | Los .docx modelo usan resaltado amarillo, no sintaxis de plantilla; docxtemplater no sirve | — Pending |
| Gemini Vision para imágenes (inline base64) | Sin storage externo; enviar directo como parte del prompt | — Pending |
| Procesamiento en memoria (no S3/Vercel Blob) | Mantener costo $0; archivos descartados tras generar el .docx | — Pending |
| Credentials Provider en NextAuth v5 | Allowlist de 5 emails no justifica OAuth; control total sobre registro | — Pending |
| maxDuration: 60 en vercel.json | Gemini + pizzip puede tardar; Hobby plan permite hasta 60s | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-10 after initialization*
