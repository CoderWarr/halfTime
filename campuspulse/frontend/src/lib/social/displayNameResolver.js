/**
 * Resolve a safe, anonymous display name for a Supabase user object.
 * Privacy: never expose email or raw user id. Deterministic fallback
 * aliases are used when no name-like metadata exists.
 */
const FIRST_NAMES = [
  'Alex', 'Sam', 'Jamie', 'Taylor', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Avery', 'Cameron',
  'Robin', 'Quinn', 'Drew', 'Kai', 'Elliot', 'Hayden', 'Sky', 'Rowan', 'Blake', 'Reese',
]

function hashStringToInt(s) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function deterministicAlias(id) {
  if (!id) return 'Someone'
  const n = hashStringToInt(id)
  const name = FIRST_NAMES[n % FIRST_NAMES.length]
  return name
}

function firstToken(value) {
  if (!value) return null
  const tok = String(value).trim().split(/\s+/)[0]
  return tok || null
}

export function resolveDisplayName(user) {
  if (!user) return 'Someone'
  const meta = user.user_metadata || {}

  // Preferred order: first_name, name/full_name, display_name, username
  const candidates = [meta.first_name, meta.given_name, meta.name, meta.full_name, meta.display_name, meta.preferred_name, meta.username]

  for (const c of candidates) {
    const first = firstToken(c)
    if (first) return sanitizeName(first)
  }

  // Deterministic alias based on user id (does not reveal id itself)
  return deterministicAlias(user.id)
}

function sanitizeName(name) {
  // Strip anything unexpected, keep short first-name-like token
  return String(name).replace(/[^\p{L}\p{M}'-]/gu, '').slice(0, 24) || 'Someone'
}

export default resolveDisplayName
