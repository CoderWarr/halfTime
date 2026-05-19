import { useEffect, useMemo, useState } from 'react'
import { useDevSocBuildings } from './useDevSocBuildings'
import { generateMapUrl, generateDirectionsUrl } from '../lib/maps/mapLinkGenerator'
import { resolveLocation } from '../lib/maps/locationResolver'

export function useMapLocation(locationLabel) {
  const { buildings } = useDevSocBuildings()
  const [meta, setMeta] = useState({ loading: true })

  const resolved = useMemo(() => resolveLocation(locationLabel, buildings), [locationLabel, buildings])

  useEffect(() => {
    let cancelled = false
    async function build() {
      if (!locationLabel) {
        if (!cancelled) setMeta({ loading: false })
        return
      }

      // If we matched a building, prefer the building name as the query.
      if (resolved?.type === 'building') {
        const buildingName = resolved.building?.name || locationLabel
        const mapUrl = generateMapUrl({ query: buildingName })
        const directionsUrl = generateDirectionsUrl({ query: buildingName })
        if (!cancelled) setMeta({ loading: false, mapUrl, directionsUrl, buildingName })
        return
      }

      // Fallback: use raw text search
      const mapUrl = generateMapUrl({ query: locationLabel })
      const directionsUrl = generateDirectionsUrl({ query: locationLabel })
      if (!cancelled) setMeta({ loading: false, mapUrl, directionsUrl })
    }

    build()
    return () => { cancelled = true }
  }, [locationLabel, resolved])

  return meta
}

export default useMapLocation
