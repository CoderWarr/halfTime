/**
 * Animated placeholder that mirrors the shape of ActivityCard.
 * Rendered while the feed is loading its initial fetch.
 */
export function SkeletonCard() {
  return (
    <div className="w-full animate-pulse rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 rounded-full bg-gray-200" />
        <div className="ml-auto h-4 w-20 rounded bg-gray-200" />
      </div>
      <div className="mt-3 h-5 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-gray-200" />
        <div className="h-9 w-20 rounded-lg bg-gray-200" />
      </div>
    </div>
  )
}
