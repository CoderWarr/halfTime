export function getActivityCapacityState(activity) {
  const spotsJoined = Number(activity?.spots_joined ?? 0)
  const spotsTotal = Math.max(1, Number(activity?.spots_total ?? 0))

  return {
    spotsJoined,
    spotsTotal,
    isFull: spotsJoined >= spotsTotal,
  }
}

export function didActivityJustFill(previousActivity, nextActivity) {
  if (!previousActivity || !nextActivity) return false

  const previous = getActivityCapacityState(previousActivity)
  const next = getActivityCapacityState(nextActivity)

  return previous.spotsJoined < previous.spotsTotal && next.spotsJoined >= next.spotsTotal
}