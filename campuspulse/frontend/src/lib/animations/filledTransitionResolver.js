import { didActivityJustFill } from './activityCapacityWatcher'

export function resolveFilledTransitions(previousById, nextActivities) {
  const nextById = new Map()
  const filledIds = []

  for (const activity of nextActivities) {
    nextById.set(activity.id, activity)

    const previousActivity = previousById.get(activity.id)
    if (didActivityJustFill(previousActivity, activity)) {
      filledIds.push(activity.id)
    }
  }

  return { filledIds, nextById }
}