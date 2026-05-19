import { useEffect, useState } from 'react'
import { fetchAvailableRooms } from '../lib/devsoc'

export function useStudyRoomSuggestions(spots) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const result = await fetchAvailableRooms({ spots })
        if (!cancelled) {
          setSuggestions(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [spots])

  return { suggestions, loading, error }
}