/**
 * Horizontal pill row for filtering the feed by tag. Sticks under the
 * header. "All" pill (null tag) is the default selection.
 */
import { TAGS } from '../../constants/tags'

const BASE_PILL = 'rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors'

export function TagFilter({ activeTag, onTagChange }) {
  return (
    <div className="sticky top-[57px] z-10 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
        <button
          type="button"
          onClick={() => onTagChange(null)}
          className={`${BASE_PILL} ${
            activeTag === null ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          All
        </button>
        {TAGS.map((t) => {
          const active = activeTag === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onTagChange(t.value)}
              className={`${BASE_PILL} ${active ? t.pillActive : t.pill}`}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
