# TMA — App interna Nicholson & Cano

Proyecto desarrollado con GSD (Get Shit Done). Lee `.planning/STATE.md` para contexto actual y `.planning/ROADMAP.md` para estructura de fases.

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS
- NextAuth.js v5 (Credentials Provider + bcrypt)
- MongoDB Atlas (free tier M0)
- Gemini API `gemini-2.0-flash` (free tier)
- Recharts
- pizzip + manipulación directa de `word/document.xml`
- mammoth (docx→texto), pdf-parse (pdf→texto)
- Vercel Hobby

## Reglas críticas

- **NO usar docxtemplater** — los .docx usan `<w:highlight w:val="yellow"/>` para marcar campos, no sintaxis de plantilla
- **NO almacenar archivos subidos** — todo en memoria, descartar tras generar el .docx
- **`maxDuration: 60`** en vercel.json para la route de generación de contratos
- **Allowlist fija** en código: nsilva@nyc.com.ar, crivera@nyc.com.ar, tderosa@nyc.com.ar, vespinola@nyc.com.ar, ekoch@nyc.com.ar

## Identidad visual Driva Dev

```
Principal (CTAs):    #EA580C
Titulares (H1/H2):   #9A3412
Acento:              #FED7AA
Fondo:               #FFF7ED
Texto oscuro:        #1C1917
Tipografía:          Poppins (Google Fonts)
```

Footer en todas las páginas: "Desarrollado por Driva Dev" → link a https://drivadev.com.ar

## Workflow GSD

Este proyecto usa el workflow GSD. Para continuar:

```
/gsd-discuss-phase 1   # discutir enfoque antes de planear
/gsd-plan-phase 1      # crear plan detallado
/gsd-execute-phase 1   # ejecutar el plan
```

Ver `.planning/ROADMAP.md` para fases y `.planning/STATE.md` para posición actual.
