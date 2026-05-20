/**
 * DevSoc GraphQL API integration.
 * Used for live campus building data and study-room availability.
 */
const DEFAULT_GRAPHQL_ENDPOINT = 'https://graphql.csesoc.app/v1/graphql'
const GRAPHQL_ENDPOINT = import.meta.env.VITE_DEVSOC_GRAPHQL_URL || DEFAULT_GRAPHQL_ENDPOINT

async function requestGraphQL(query, variables = {}) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`DevSoc GraphQL request failed with ${response.status}`)
  }

  const payload = await response.json()
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '))
  }

  return payload.data
}

export async function fetchCampusBuildings() {
  const data = await requestGraphQL(`
    query CampusBuildings {
      buildings(order_by: {name: asc}) {
        id
        name
        rooms_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  `)

  return (data?.buildings ?? []).map((building) => ({
    id: building.id,
    name: building.name,
    roomCount: building.rooms_aggregate?.aggregate?.count ?? 0,
  }))
}

export async function fetchAvailableRooms({ spots = 1 } = {}) {
  const minimumCapacity = Number.isFinite(spots) && spots > 0 ? spots : 1
  const now = Date.now()
  const windowStart = new Date(now).toISOString()
  const windowEnd = new Date(now + 60 * 60 * 1000).toISOString()

  const data = await requestGraphQL(
    `
      query StudyRoomSuggestions($start: timestamptz!, $end: timestamptz!, $minimumCapacity: Int!) {
        rooms(
          where: { capacity: { _gte: $minimumCapacity } }
          order_by: [{ capacity: asc }, { name: asc }]
        ) {
          id
          name
          capacity
          building {
            id
            name
          }
          bookings(where: { start: { _lt: $end }, end: { _gt: $start } }) {
            id
          }
        }
      }
    `,
    {
      start: windowStart,
      end: windowEnd,
      minimumCapacity,
    },
  )

  return (data?.rooms ?? [])
    .filter((room) => (room.bookings ?? []).length === 0)
    .slice(0, 3)
    .map((room) => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      buildingId: room.building?.id ?? '',
      buildingName: room.building?.name ?? '',
    }))
}
