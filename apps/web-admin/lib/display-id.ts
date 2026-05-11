// Short display ID for admin tables.
// Prefers the DB-issued `display_id` (a stored generated column derived from the UUID).
// Falls back to computing the same value client-side if the row is missing the field.
// Format: PZ-{U|P|T}{first 6 hex chars of UUID}, e.g. PZ-U1A2B3C.

type Prefix = 'U' | 'P' | 'T'

export function displayId(row: Record<string, unknown> | null | undefined, prefix: Prefix): string {
  if (!row) return '—'
  const stored = row.display_id
  if (typeof stored === 'string' && stored.length > 0) return stored
  const uuid = row.id
  if (typeof uuid !== 'string' || uuid.length === 0) return '—'
  return `PZ-${prefix}${uuid.slice(0, 6).replace(/-/g, '').toUpperCase()}`
}
