/**
 * Activities hook — fetches active activities and subscribes to realtime
 * inserts / updates / deletes. Stage 4 fills in the implementation.
 */
import { useState } from 'react'

export function useActivities() {
  const [activities] = useState([])
  const [loading] = useState(false)
  const [error] = useState(null)

  // TODO Stage 4: initial fetch + realtime subscription
  return { activities, loading, error }
}
