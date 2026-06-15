# Plan 03-05 Summary — Verificación GREEN + Checkpoint Humano

**Status:** ✓ APROBADO 2026-06-15

## Resultado

Suite completa: **55/55 tests**, TypeScript limpio, ESLint limpio.

Checkpoint humano: usuario aprobó Fase 3 el 2026-06-15.

## Bugs corregidos durante verificación

Cuatro bugs estructurales descubiertos y resueltos tras la implementación:

| Commit | Bug | Síntoma |
|--------|-----|---------|
| `548d2d3` | Bookmark IDs duplicados al clonar fila de locador | "Unspecified error, Line:0, Col:0" |
| `89fbbba` | Chars de control XML 1.0 inválidos (blacklist incompleta) | "Xml parsing error, Line:2, Col:N" |
| `a38d96b` | C1 mojibake CP1252 (comillas/guiones de Gemini) — whitelist dejaba pasar 0x80-0x9F | Mismo síntoma, columna fija |
| `ffcf3d8` | Pasadas de fill encadenadas con offsets desfasados — Adenda tagcorrupt | "Xml parsing error" / tag truncado `<w:sz w:` |

## Fix estructural más relevante (ffcf3d8)

Introduce `Splice {start, end, replacement}` + `applySplices()` que combina todas las ediciones en UN solo paso descendente. Antes, `fillHighlightPlaceholders` + `fillUnderscoredPlaceholders` usaban offsets calculados sobre el XML original pero se aplicaban secuencialmente — la primera pasada desplazaba los offsets que usaba la segunda, corrompiendo tags a mitad.

## Archivos modificados

- `src/lib/contracts/fillPlaceholders.ts` — applySplices, build*Splices, CP1252 map, escapeXml whitelist
- `src/app/api/contracts/generate/route.ts` — pasada única combinada
- `src/__tests__/contracts/generateRoute.test.ts` — mocks actualizados a nuevas exports
