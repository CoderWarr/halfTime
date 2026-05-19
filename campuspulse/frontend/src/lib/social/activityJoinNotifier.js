import { resolveDisplayName } from './displayNameResolver'

// Map tags to subtle tailwind color classes for a small indicator dot
export const TAG_COLOR = {
  study: 'bg-blue-500',
  sports: 'bg-green-500',
  food: 'bg-orange-500',
  social: 'bg-purple-500',
  chill: 'bg-gray-500',
}

export function buildJoinMessage({ user, tag }) {
  const name = resolveDisplayName(user)
  return { text: `${name} joined`, name, tag }
}

export default buildJoinMessage
