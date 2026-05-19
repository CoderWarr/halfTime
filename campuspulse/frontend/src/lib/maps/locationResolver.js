/**
 * Lightweight resolver that attempts to match a freeform location string
 * against campus building names returned by the existing DevSoc fetch.
 * Returns a small metadata object that higher-level hooks can use to
 * build map links. This intentionally does not assume the GraphQL
 * schema provides coordinates — it will gracefully fall back to
 * text-based queries.
 */
export function resolveLocation(label, buildings = []) {
  if (!label) return null
  const norm = label.trim().toLowerCase()

  // Try exact match first
  const exact = buildings.find((b) => (b.name || '').toLowerCase() === norm)
  if (exact) return { type: 'building', building: exact }

  // Try startsWith and includes
  const starts = buildings.find((b) => (b.name || '').toLowerCase().startsWith(norm) || norm.startsWith((b.name || '').toLowerCase()))
  if (starts) return { type: 'building', building: starts }

  const includes = buildings.find((b) => (b.name || '').toLowerCase().includes(norm) || norm.includes((b.name || '').toLowerCase()))
  if (includes) return { type: 'building', building: includes }

  // No building match — treat as generic query
  return { type: 'query', query: label }
}

export default { resolveLocation }
