import { useEffect, useState } from 'react'
import { fetchCampusBuildings } from '../lib/devsoc'

export function useDevSocBuildings() {
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const result = await fetchCampusBuildings()
        if (!cancelled) {
          setBuildings(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setBuildings([])
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
  }, [])

  return { buildings, loading, error }
}