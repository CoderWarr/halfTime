/**
 * Live room suggestions for study activities.
 * Renders 3 selectable pills sourced from the DevSoc GraphQL API.
 */
import { useStudyRoomSuggestions } from '../../hooks/useStudyRoomSuggestions'

export function RoomSuggestion({ spots, selectedLocation, onSelectLocation }) {
  const { suggestions, loading } = useStudyRoomSuggestions(spots)

  if (loading) {
    return (
      <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
        Finding free rooms for the next hour...
      </div>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">
        Free rooms nearby
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((room) => {
          const locationValue = `${room.buildingName} - ${room.name}`
          const active = selectedLocation === locationValue

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectLocation(locationValue)}
              aria-pressed={active}
              className={`flex flex-col rounded-full border px-3 py-2 text-left text-xs transition ${
                active
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-indigo-200 bg-white text-indigo-900 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <span className="font-medium">{room.name}</span>
              <span className={active ? 'text-indigo-100' : 'text-indigo-600'}>
                {room.buildingName} · seats {room.capacity}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
