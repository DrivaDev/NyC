import slugify from 'slugify'
import { nanoid } from 'nanoid'

/**
 * Generates a URL-safe slug from a restaurant name.
 * Format: "la-trattoria-x8k2mq"
 * Immutable after first save — never call this on update.
 * nanoid(6) = ~68 billion combinations; collision probability negligible.
 */
export function generateSlug(name: string): string {
  const base = slugify(name, { lower: true, strict: true })
  const suffix = nanoid(6)
  // If name is all non-ASCII (strict mode strips everything), use suffix only
  const slug = base ? `${base}-${suffix}` : suffix
  // Enforce max 60 chars (CONTEXT.md constraint)
  return slug.slice(0, 60)
}

/**
 * Validates a user-provided slug before confirming.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateSlug(slug: string): string | null {
  if (!slug || slug.trim().length === 0) return 'La dirección no puede estar vacía.'
  if (slug.length > 60) return 'Máximo 60 caracteres.'
  if (!/^[a-z0-9-]+$/.test(slug)) return 'Solo letras minúsculas, números y guiones (a-z, 0-9, -).'
  if (slug.startsWith('-') || slug.endsWith('-')) return 'No puede empezar ni terminar con guión.'
  return null
}
