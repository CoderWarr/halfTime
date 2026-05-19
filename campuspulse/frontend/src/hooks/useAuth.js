/**
 * Auth hook — single source of truth for the current user session.
 * Subscribes to Supabase auth state changes and exposes sign in / sign up /
 * sign out helpers. Sign-up enforces UNSW email domains client-side.
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const UNSW_EMAIL_PATTERN = /@(student|ad)\.unsw\.edu\.au$/i

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Error fetching initial session:', error)
      }
      if (mounted) {
        setUser(data?.session?.user ?? null)
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp(email, password) {
    if (!UNSW_EMAIL_PATTERN.test(email)) {
      throw new Error('Please use a UNSW email address (@student.unsw.edu.au or @ad.unsw.edu.au).')
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { user, loading, signIn, signUp, signOut }
}
