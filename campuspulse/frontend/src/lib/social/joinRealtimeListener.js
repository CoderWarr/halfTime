import { supabase } from '../../lib/supabase'

/**
 * Subscribe to Postgres INSERTs on `joins` and invoke `onNewJoin`
 * Returns an unsubscribe function.
 */
export function subscribeJoins(onNewJoin) {
  const ch = supabase
    .channel('joins-notifications')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'joins' },
      (payload) => {
        try {
          if (payload?.new) onNewJoin(payload.new)
        } catch (err) {
          // swallow — notifications should not crash the app
          console.error('join notification handler error', err)
        }
      },
    )
    .subscribe()

  return () => {
    try {
      supabase.removeChannel(ch)
    } catch (e) {
      // ignore
    }
  }
}

export default subscribeJoins
