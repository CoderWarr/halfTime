export function generateMapUrl({ lat, lng, query }) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
  }
  const q = query || ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function generateDirectionsUrl({ lat, lng, query }) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`
  }
  const q = query || ''
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`
}

export default { generateMapUrl, generateDirectionsUrl }
