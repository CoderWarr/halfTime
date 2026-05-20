import { useEffect, useMemo, useState } from 'react'
import { useDevSocBuildings } from './useDevSocBuildings'
import { generateMapUrl, generateDirectionsUrl } from '../lib/maps/mapLinkGenerator'
import { resolveLocation } from '../lib/maps/locationResolver'
import { decodeDynamicLocationLabel } from '../lib/maps/currentLocation'

export function useMapLocation(location) {
  const { buildings } = useDevSocBuildings()
  const [meta, setMeta] = useState({ loading: true })

  const locationLabel = typeof location === 'string' ? location : location?.location_label || location?.label || ''
  const dynamicLocation = decodeDynamicLocationLabel(locationLabel)
  const latitude = typeof location === 'string' ? dynamicLocation.latitude : location?.latitude ?? location?.location_latitude ?? dynamicLocation.latitude ?? null
  const longitude = typeof location === 'string' ? dynamicLocation.longitude : location?.longitude ?? location?.location_longitude ?? dynamicLocation.longitude ?? null
  const mapUrlFromData = typeof location === 'string' ? null : location?.map_url || location?.mapUrl || null

  const resolved = useMemo(() => resolveLocation(locationLabel, buildings), [locationLabel, buildings])

  useEffect(() => {
    let cancelled = false
    async function build() {
      if (!locationLabel && !mapUrlFromData && latitude == null && longitude == null) {
        if (!cancelled) setMeta({ loading: false })
        return
      }

      if (latitude != null && longitude != null) {
        const mapUrl = mapUrlFromData || generateMapUrl({ lat: latitude, lng: longitude })
        const directionsUrl = generateDirectionsUrl({ lat: latitude, lng: longitude })
        if (!cancelled) setMeta({ loading: false, mapUrl, directionsUrl, buildingName: locationLabel })
        return
      }

      if (mapUrlFromData) {
        const directionsUrl = generateDirectionsUrl({ query: locationLabel })
        if (!cancelled) setMeta({ loading: false, mapUrl: mapUrlFromData, directionsUrl, buildingName: locationLabel })
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
  }, [locationLabel, latitude, longitude, mapUrlFromData, resolved])

  return meta
}

export default useMapLocation
