/**
 * Single activity card. Renders tag, title, location, spot counter, live
 * expiry countdown, and the join/full/joined button. Hosts also see a
 * cancel control. Returns null once the activity has expired.
 */
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { TAG_MAP } from '../../constants/tags'
import MapActionButtons from './MapActionButtons'
import { Button } from '../ui/Button'
import { toast } from '../ui/Toast'
import { decodeDynamicLocationLabel } from '../../lib/maps/currentLocation'

const TAG_FILL_COLORS = {
  study: 'bg-blue-500',
  sports: 'bg-green-500',
  food: 'bg-orange-500',
  social: 'bg-purple-500',
  chill: 'bg-gray-500',
}

function formatTimeLeft(expiresAt, now = Date.now()) {
  const diffMs = new Date(expiresAt) - new Date(now)
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin <= 0) return { text: '', expired: true, urgent: false }
  if (diffMin > 60) {
    const hr = Math.floor(diffMin / 60)
    const min = diffMin % 60
    return { text: `Expires in ${hr}h ${min}m`, expired: false, urgent: false }
  }
  if (diffMin >= 10) {
    return { text: `Expires in ${diffMin} min`, expired: false, urgent: false }
  }
  return { text: `Expires in ${diffMin} min`, expired: false, urgent: true }
}

export function ActivityCard({ activity, joined }) {
  const { user } = useAuth()
  const [now, setNow] = useState(() => Date.now())
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [hidden, setHidden] = useState(false)

  const countdown = useMemo(() => formatTimeLeft(activity.expires_at, now), [activity.expires_at, now])

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
    }, 30000)
    return () => clearInterval(id)
  }, [activity.expires_at])

  if (countdown.expired || hidden) return null

  const tag = TAG_MAP[activity.tag]
  const isHost = user?.id === activity.created_by
  const isFull = activity.spots_joined >= activity.spots_total
  const percent = Math.min(100, Math.round((activity.spots_joined / activity.spots_total) * 100))
  const displayLocation = decodeDynamicLocationLabel(activity.location_label).displayLabel || activity.location_label

  async function handleJoin() {
    if (!user) return
    setJoining(true)
    const { error } = await supabase
      .from('joins')
      .insert({ activity_id: activity.id, user_id: user.id })
    setJoining(false)

    if (error) {
      const msg = (error.message ?? '').toLowerCase()
      if (msg.includes('full')) toast.error('Sorry, this activity just filled up.')
      else if (msg.includes('unique') || msg.includes('duplicate')) toast.error("You've already joined this one.")
      else toast.error('Could not join. Try again.')
      return
    }
    toast.success('Joined! See you there 👋')
  }

  async function handleLeave() {
    if (!user) return
    setLeaving(true)
    const { error } = await supabase
      .from('joins')
      .delete()
      .eq('activity_id', activity.id)
      .eq('user_id', user.id)
    setLeaving(false)

    if (error) {
      toast.error('Could not leave. Try again.')
      return
    }
    toast.info('Left activity.')
  }

  async function handleCancel() {
    if (!isHost) return
    if (!window.confirm('Cancel this activity?')) return
    setCancelling(true)
    const { data, error } = await supabase
      .from('activities')
      .update({ is_cancelled: true })
      .eq('id', activity.id)
      .select()
    setCancelling(false)

    if (error || !data || data.length === 0) {
      toast.error('Could not cancel. Try again.')
      return
    }
    setHidden(true)
    toast.info('Activity cancelled.')
  }

  let joinButton
  if (joined && isHost) {
    joinButton = (
      <Button variant="secondary" disabled className="text-green-600">
        Joined ✓
      </Button>
    )
  } else if (joined) {
    joinButton = (
      <Button variant="secondary" onClick={handleLeave} loading={leaving} className="text-red-600 border border-red-500 hover:bg-red-50">
        Leave
      </Button>
    )
  } else if (isFull) {
    joinButton = (
      <Button variant="secondary" disabled>
        Full 🔒
      </Button>
    )
  } else if (isHost) {
    joinButton = (
      <Button variant="secondary" disabled>
        Your activity
      </Button>
    )
  } else {
    joinButton = (
      <Button onClick={handleJoin} loading={joining}>
        Join
      </Button>
    )
  }

  return (
    <article className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tag?.pill ?? 'bg-gray-100 text-gray-700'}`}
        >
          {tag?.label ?? activity.tag}
        </span>
        <span
          className={`ml-auto text-xs ${countdown.urgent ? 'text-red-500 font-medium' : 'text-gray-500'}`}
        >
          {countdown.text}
        </span>
        {isHost && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="ml-2 text-xs text-gray-400 hover:text-red-600 disabled:opacity-50"
          >
            ✕ Cancel
          </button>
        )}
      </div>

      <h3 className="mt-2 text-lg font-semibold text-gray-900">{activity.title}</h3>
      <div className="mt-0.5 flex items-center gap-2 text-sm text-gray-500">
        <p className="flex items-center gap-2">
          <span className="mr-1">📍</span>
          <span>{displayLocation}</span>
        </p>
        <MapActionButtons location={activity} />
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full ${TAG_FILL_COLORS[activity.tag] ?? 'bg-indigo-500'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {activity.spots_joined} / {activity.spots_total} spots filled
        </p>
      </div>

      <div className="mt-3 flex justify-end">{joinButton}</div>
    </article>
  )
}
