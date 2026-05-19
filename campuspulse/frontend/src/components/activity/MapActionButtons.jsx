import useMapLocation from '../../hooks/useMapLocation'

export function MapActionButtons({ location }) {
  const meta = useMapLocation(location)

  const locationLabel = typeof location === 'string' ? location : location?.location_label || location?.label || ''

  if (!locationLabel && !location?.map_url && location?.latitude == null && location?.longitude == null) return null

  const mapUrl = meta?.mapUrl
  const directionsUrl = meta?.directionsUrl

  return (
    <span className="inline-flex items-center gap-2 ml-2">
      {mapUrl && (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:underline"
          aria-label="Open map"
        >
          🗺️ Open Map
        </a>
      )}
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:underline"
          aria-label="Get directions"
        >
          ➜ Directions
        </a>
      )}
    </span>
  )
}

export default MapActionButtons
