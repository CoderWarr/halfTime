const GOOGLE_GEOCODING_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_GEOCODING_API_KEY ||
  ''

export const CURRENT_LOCATION_VALUE = '__current_location__'
const DYNAMIC_LOCATION_SUFFIX = '[[cp-location:'

export function encodeDynamicLocationLabel(label, latitude, longitude) {
  const displayLabel = label || 'Current location'
  return `${displayLabel} ${DYNAMIC_LOCATION_SUFFIX}${latitude},${longitude}]]`
}

export function decodeDynamicLocationLabel(label) {
  if (!label) return { displayLabel: '', latitude: null, longitude: null, isDynamicLocation: false }

  const match = /^(.*) \[\[cp-location:([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)\]\]$/.exec(label)
  if (!match) {
    return { displayLabel: label, latitude: null, longitude: null, isDynamicLocation: false }
  }

  return {
    displayLabel: match[1],
    latitude: Number(match[2]),
    longitude: Number(match[3]),
    isDynamicLocation: true,
  }
}

export function getCurrentPosition(options = {}) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('Geolocation is not supported by this browser.'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 60_000,
      ...options,
    })
  })
}

export async function reverseGeocodeCoordinates(latitude, longitude) {
  if (!GOOGLE_GEOCODING_API_KEY) return null

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('latlng', `${latitude},${longitude}`)
  url.searchParams.set('key', GOOGLE_GEOCODING_API_KEY)

  try {
    const response = await fetch(url.toString())
    if (!response.ok) return null

    const payload = await response.json()
    const result = payload?.results?.[0]
    return result?.formatted_address ?? null
  } catch {
    return null
  }
}

export default {
  CURRENT_LOCATION_VALUE,
  encodeDynamicLocationLabel,
  decodeDynamicLocationLabel,
  getCurrentPosition,
  reverseGeocodeCoordinates,
}