import { useEffect, useRef } from 'react'
import React from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { buildJoinMessage } from './activityJoinNotifier'
import { toast as hotToast } from 'react-hot-toast'
import JoinToast from '../../components/ui/JoinToast'

/**
 * Hook: set up a single subscription to join INSERTs and show subtle toasts
 * only for other users, deduplicated and filtered for active activities.
 */
export function useJoinNotifications() {
  const { user } = useAuth()
  const seen = useRef(new Set())
  const mountedAt = useRef(Date.now())

  useEffect(() => {
    function prune() {
      // keep the seen set small: remove entries older than ~60s by recreating
      if (seen.current.size > 200) seen.current = new Set()
    }

    const ch = supabase
      .channel('joins-notifications-hook')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'joins' },
        async (payload) => {
          const j = payload.new
          if (!j) return

          // ignore self joins
          if (user && j.user_id === user.id) return

          // ignore historical joins that predate this mount
          const ts = j.joined_at ? new Date(j.joined_at).getTime() : Date.now()
          if (ts < mountedAt.current - 1000) return

          // dedupe by join id
          if (seen.current.has(j.id)) return
          seen.current.add(j.id)
          setTimeout(() => {
            seen.current.delete(j.id)
          }, 60 * 1000)

          prune()

          // verify activity is still active and get its tag for emoji
          try {
            const { data: activity } = await supabase
              .from('activities')
              .select('id, expires_at, is_cancelled, tag')
              .eq('id', j.activity_id)
              .maybeSingle()

            if (!activity) return
            if (activity.is_cancelled) return
            if (new Date(activity.expires_at).getTime() <= Date.now()) return

            // build display name & tag, then show a small top-right toast
            const fakeUser = { id: j.user_id, user_metadata: j.user_metadata ?? {} }
            const { name, tag } = buildJoinMessage({ user: fakeUser, tag: activity.tag })

            hotToast.custom(
              (t) => React.createElement(JoinToast, { name, tag }),
              { duration: 4500, position: 'top-right' },
            )
          } catch (err) {
            // don't break the app for notification errors
            console.error('join notification verify error', err)
          }
        },
      )
      .subscribe()

    return () => {
      try {
        supabase.removeChannel(ch)
      } catch (e) {}
    }
  }, [user?.id])
}

export default useJoinNotifications
