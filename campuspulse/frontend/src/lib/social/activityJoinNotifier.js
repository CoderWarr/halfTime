import { resolveDisplayName } from './displayNameResolver'

export const TAG_EMOJI = {
  study: '📚',
  sports: '🏀',
  food: '🍔',
  social: '🎉',
  chill: '☕',
}

export function buildJoinMessage({ user, tag }) {
  const name = resolveDisplayName(user)
  const emoji = TAG_EMOJI[tag] || '✨'
  return { text: `${name} joined ${emoji}`, name, emoji }
}

export default buildJoinMessage
