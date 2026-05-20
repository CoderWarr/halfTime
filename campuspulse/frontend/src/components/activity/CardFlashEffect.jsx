export function CardFlashEffect({ active, children }) {
  const cardClassName = active
    ? 'activity-card-just-filled border-emerald-200 bg-emerald-50 shadow-lg shadow-emerald-100/70'
    : ''

  const badgeClassName = active
    ? 'activity-card-fill-badge'
    : 'pointer-events-none opacity-0'

  return children({ cardClassName, badgeClassName, active })
}

export default CardFlashEffect