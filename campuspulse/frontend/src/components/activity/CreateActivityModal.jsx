/**
 * Modal for posting a new activity. Handles form state, inline validation,
 * and the Supabase insert. Renders RoomSuggestion for study activities.
 * Closes on backdrop click, the × button, or the Escape key.
 */
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { TAGS } from '../../constants/tags'
import { CAMPUS_LOCATIONS } from '../../constants/locations'
import { Button } from '../ui/Button'
import { toast } from '../ui/Toast'
import { RoomSuggestion } from './RoomSuggestion'

const EXPIRY_OPTIONS = [
  { label: '15 min', ms: 15 * 60_000 },
  { label: '30 min', ms: 30 * 60_000 },
  { label: '1 hour', ms: 60 * 60_000 },
  { label: '2 hours', ms: 120 * 60_000 },
]

const MIN_SPOTS = 1
const MAX_SPOTS = 20
const TITLE_LIMIT = 60

export function CreateActivityModal({ onClose, onSuccess }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('')
  const [location, setLocation] = useState('')
  const [spots, setSpots] = useState(4)
  const [expiryMs, setExpiryMs] = useState(EXPIRY_OPTIONS[1].ms)

  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function validate() {
    const next = {}
    if (!title.trim()) next.title = 'Title is required.'
    if (!tag) next.tag = 'Pick a tag.'
    if (!location) next.location = 'Pick a location.'
    if (!spots || spots < MIN_SPOTS) next.spots = `At least ${MIN_SPOTS} spot.`
    if (!expiryMs) next.expiry = 'Pick an expiry.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!validate()) return
    if (!user) {
      setFormError('You must be logged in.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('activities').insert({
      title: title.trim(),
      tag,
      location_label: location,
      spots_total: spots,
      expires_at: new Date(Date.now() + expiryMs).toISOString(),
      created_by: user.id,
    })
    setSubmitting(false)

    if (error) {
      setFormError(error.message ?? 'Could not post activity.')
      return
    }
    toast.success('Activity posted! 🎉')
    onSuccess?.()
  }

  function clampSpots(next) {
    return Math.max(MIN_SPOTS, Math.min(MAX_SPOTS, next))
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1 text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          Post an activity
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Tell campus what you're doing right now.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <span className="text-xs text-gray-400">
                {TITLE_LIMIT - title.length} left
              </span>
            </div>
            <input
              id="title"
              type="text"
              maxLength={TITLE_LIMIT}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Need 2 more for basketball"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tag</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TAGS.map((t) => {
                const active = tag === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTag(t.value)}
                    className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ring-transparent transition ${
                      active ? `${t.pillActive} ring-offset-1 ring-gray-300` : t.pill
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
            {errors.tag && (
              <p className="mt-1 text-xs text-red-600">{errors.tag}</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Pick a location
              </option>
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            {errors.location && (
              <p className="mt-1 text-xs text-red-600">{errors.location}</p>
            )}
            {tag === 'study' && (
              <div className="mt-2">
                <RoomSuggestion />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Spots needed</label>
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSpots((s) => clampSpots(s - 1))}
                className="h-9 w-9 rounded-lg border border-gray-300 text-lg text-gray-600 hover:bg-gray-50"
                aria-label="Decrease spots"
              >
                −
              </button>
              <span className="min-w-6 text-center text-base font-semibold text-gray-900">
                {spots}
              </span>
              <button
                type="button"
                onClick={() => setSpots((s) => clampSpots(s + 1))}
                className="h-9 w-9 rounded-lg border border-gray-300 text-lg text-gray-600 hover:bg-gray-50"
                aria-label="Increase spots"
              >
                +
              </button>
            </div>
            {errors.spots && (
              <p className="mt-1 text-xs text-red-600">{errors.spots}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Expires in</label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EXPIRY_OPTIONS.map((opt) => {
                const active = expiryMs === opt.ms
                return (
                  <button
                    key={opt.ms}
                    type="button"
                    onClick={() => setExpiryMs(opt.ms)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {errors.expiry && (
              <p className="mt-1 text-xs text-red-600">{errors.expiry}</p>
            )}
          </div>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <Button type="submit" loading={submitting} className="w-full">
            Post activity
          </Button>
        </form>
      </div>
    </div>
  )
}
