/**
 * Activity feed list. Subscribes to live data via useActivities, applies the
 * current tag filter + client-side expiry filter, and handles loading,
 * error, and empty states.
 */
import { useActivities } from '../../hooks/useActivities'
import { ActivityCard } from './ActivityCard'
import { SkeletonCard } from '../ui/SkeletonCard'

export function ActivityFeed({ activeTag }) {
  const { activities, joinedActivityIds, loading, error } = useActivities()

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Could not load activities. Please refresh
      </div>
    )
  }

  const now = new Date()
  const filtered = activities.filter(
    (a) =>
      (!activeTag || a.tag === activeTag) &&
      new Date(a.expires_at) > now,
  )

  if (filtered.length === 0) {
    return (
      <div className="mt-16 text-center text-gray-400">
        <p className="mt-2 font-medium">Nothing happening right now</p>
        <p className="text-sm">Be the first to post something!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map((a) => (
        <ActivityCard
          key={a.id}
          activity={a}
          joined={joinedActivityIds.has(a.id)}
        />
      ))}
    </div>
  )
}
