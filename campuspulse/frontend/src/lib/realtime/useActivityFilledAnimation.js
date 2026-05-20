import { useEffect, useRef, useState } from 'react'
import { resolveFilledTransitions } from '../animations/filledTransitionResolver'

const FLASH_DURATION_MS = 1800

export function useActivityFilledAnimation(activities) {
  const [recentlyFilledIds, setRecentlyFilledIds] = useState(() => new Set())
  const previousByIdRef = useRef(new Map())
  const initializedRef = useRef(false)
  const timeoutIdsRef = useRef(new Map())

  useEffect(() => {
    if (!initializedRef.current) {
      previousByIdRef.current = new Map(activities.map((activity) => [activity.id, activity]))
      initializedRef.current = true
      return
    }

    const { filledIds, nextById } = resolveFilledTransitions(previousByIdRef.current, activities)
    previousByIdRef.current = nextById

    if (filledIds.length === 0) return

    setRecentlyFilledIds((prev) => {
      const next = new Set(prev)
      filledIds.forEach((id) => next.add(id))
      return next
    })

    filledIds.forEach((id) => {
      const existingTimeout = timeoutIdsRef.current.get(id)
      if (existingTimeout) clearTimeout(existingTimeout)

      const timeoutId = setTimeout(() => {
        setRecentlyFilledIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        timeoutIdsRef.current.delete(id)
      }, FLASH_DURATION_MS)

      timeoutIdsRef.current.set(id, timeoutId)
    })
  }, [activities])

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current

    return () => {
      timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutIds.clear()
    }
  }, [])

  return recentlyFilledIds
}

export default useActivityFilledAnimation