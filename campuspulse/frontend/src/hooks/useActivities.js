/**
 * Activities hook — source of truth for the live feed.
 * Fetches active activities + the current user's join set, then keeps both
 * in sync via Postgres realtime channels (activities + joins).
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useActivities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [joinedActivityIds, setJoinedActivityIds] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data: activityRows, error: actErr } = await supabase
        .from('activities')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .eq('is_cancelled', false)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (actErr) {
        setError(actErr)
        setLoading(false)
        return
      }
      setActivities(activityRows ?? [])

      if (user) {
        const { data: joinRows, error: joinErr } = await supabase
          .from('joins')
          .select('activity_id')
          .eq('user_id', user.id)

        if (cancelled) return

        if (joinErr) {
          setError(joinErr)
        } else {
          setJoinedActivityIds(new Set((joinRows ?? []).map((j) => j.activity_id)))
        }
      } else {
        setJoinedActivityIds(new Set())
      }

      setLoading(false)
    }

    load()

    const activitiesChannel = supabase
      .channel('activities-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setActivities((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            // Drop the row from the feed once it's cancelled — the SELECT
            // policy hides it from a refetch anyway, so we mirror that locally.
            if (payload.new?.is_cancelled) {
              setActivities((prev) => prev.filter((a) => a.id !== payload.new.id))
            } else {
              setActivities((prev) =>
                prev.map((a) => (a.id === payload.new.id ? payload.new : a)),
              )
            }
          } else if (payload.eventType === 'DELETE') {
            setActivities((prev) => prev.filter((a) => a.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    const joinsChannel = supabase
      .channel('joins-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'joins' },
        (payload) => {
          if (!user) return
          if (payload.eventType === 'INSERT' && payload.new?.user_id === user.id) {
            setJoinedActivityIds((prev) => {
              const next = new Set(prev)
              next.add(payload.new.activity_id)
              return next
            })
          } else if (payload.eventType === 'DELETE') {
            // DELETE payloads only include primary keys unless REPLICA IDENTITY FULL
            // is set, so user_id may be missing. Refetch the current user's joins
            // to stay in sync when any join row is removed.
            supabase
              .from('joins')
              .select('activity_id')
              .eq('user_id', user.id)
              .then(({ data }) => {
                if (cancelled) return
                setJoinedActivityIds(new Set((data ?? []).map((j) => j.activity_id)))
              })
          }
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(activitiesChannel)
      supabase.removeChannel(joinsChannel)
    }
  }, [user?.id])

  return { activities, joinedActivityIds, loading, error }
}
