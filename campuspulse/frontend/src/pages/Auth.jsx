/**
 * Auth page — sign up / log in toggle. Enforces UNSW email domains on
 * sign-up before calling Supabase, surfaces inline errors per field,
 * and navigates to /feed on success.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'

const MODE_LOGIN = 'login'
const MODE_SIGNUP = 'signup'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState(MODE_LOGIN)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isSignup = mode === MODE_SIGNUP

  function resetErrors() {
    setEmailError('')
    setPasswordError('')
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    resetErrors()

    let hasError = false
    if (!email) {
      setEmailError('Email is required.')
      hasError = true
    }
    if (!password) {
      setPasswordError('Password is required.')
      hasError = true
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      hasError = true
    }
    if (hasError) return

    setSubmitting(true)
    try {
      if (isSignup) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      navigate('/feed', { replace: true })
    } catch (err) {
      const message = err?.message ?? 'Something went wrong. Please try again.'
      if (message.toLowerCase().includes('unsw')) {
        setEmailError(message)
      } else {
        setFormError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function toggleMode() {
    resetErrors()
    setMode(isSignup ? MODE_LOGIN : MODE_SIGNUP)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isSignup
            ? 'Sign up with your UNSW email to start joining activities.'
            : 'Log in to see what is happening on campus right now.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              UNSW email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="z1234567@ad.unsw.edu.au"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {emailError && (
              <p className="mt-1 text-xs text-red-600">{emailError}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {passwordError && (
              <p className="mt-1 text-xs text-red-600">{passwordError}</p>
            )}
          </div>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <Button type="submit" loading={submitting} className="w-full">
            {isSignup ? 'Sign up' : 'Log in'}
          </Button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-4 w-full text-center text-sm text-indigo-600 hover:text-indigo-700"
        >
          {isSignup
            ? 'Already have an account? Log in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}
