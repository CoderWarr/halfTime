/**
 * Modal for posting a new activity. Handles form state, inline validation,
 * and the Supabase insert. Renders RoomSuggestion for study activities.
 * Closes on backdrop click, the × button, or the Escape key.
 */
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useDevSocBuildings } from '../../hooks/useDevSocBuildings'
import { TAGS } from '../../constants/tags'
import {
  CAMPUS_LOCATIONS,
  MANUAL_CAMPUS_LOCATIONS,
} from '../../constants/locations'
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

function highlightMatch(text, query) {
  const trimmed = query.trim()
  if (!trimmed) return text

  const lowerText = text.toLowerCase()
  const lowerQuery = trimmed.toLowerCase()
  const matchIndex = lowerText.indexOf(lowerQuery)

  if (matchIndex === -1) return text

  const before = text.slice(0, matchIndex)
  const match = text.slice(matchIndex, matchIndex + trimmed.length)
  const after = text.slice(matchIndex + trimmed.length)

  return (
    <>
      {before}
      <span className="font-semibold text-indigo-700">{match}</span>
      {after}
    </>
  )
}

export function CreateActivityModal({ onClose, onSuccess }) {
  const { user } = useAuth()
  const { buildings, loading: loadingBuildings, error: buildingsError } = useDevSocBuildings()
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [location, setLocation] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
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

  const liveBuildingOptions = buildings.length > 0
    ? buildings.map((building) => ({
        value: building.name,
        label: `${building.name} (${building.roomCount} room${building.roomCount === 1 ? '' : 's'})`,
      }))
    : CAMPUS_LOCATIONS.map((loc) => ({
        value: loc,
        label: loc,
      }))

  const manualLocationOptions = MANUAL_CAMPUS_LOCATIONS.map((loc) => ({
    value: loc,
    label: loc,
  }))

  const locationOptions = [...liveBuildingOptions, ...manualLocationOptions]
  const filteredLocationOptions = locationOptions.filter((option) =>
    `${option.label} ${option.value}`.toLowerCase().includes(locationSearch.trim().toLowerCase()),
  )
  const sortedLocationOptions = [...filteredLocationOptions].sort((left, right) => {
    const query = locationSearch.trim().toLowerCase()
    if (!query) return 0

    const leftPrefix = left.label.toLowerCase().startsWith(query) ? 0 : 1
    const rightPrefix = right.label.toLowerCase().startsWith(query) ? 0 : 1
    if (leftPrefix !== rightPrefix) return leftPrefix - rightPrefix
    return left.label.localeCompare(right.label)
  })

  // Helpers for keyboard navigation and scrolling
  function openAndHighlightInitial() {
    setIsOpen(true)
    const query = locationSearch.trim().toLowerCase()
    const firstMatch = sortedLocationOptions.findIndex((opt) =>
      opt.label.toLowerCase().startsWith(query) || opt.value.toLowerCase().startsWith(query),
    )
    if (firstMatch !== -1) setActiveIndex(firstMatch)
    else setActiveIndex(sortedLocationOptions.length > 0 ? 0 : -1)
  }

  useEffect(() => {
    if (activeIndex < 0) return
    const list = containerRef.current?.querySelector('[data-locations-list]')
    const item = list?.querySelector(`[data-option-index="${activeIndex}"]`)
    if (item) item.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeIndex, sortedLocationOptions])

  useEffect(() => {
    function onDocMouse(e) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', onDocMouse)
    return () => document.removeEventListener('mousedown', onDocMouse)
  }, [])

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

        <h2 className="text-xl font-semibold tracking-tight text-gray-900">Post an activity</h2>
        <p className="mt-1 text-sm text-gray-500">Tell campus what you're doing right now.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <span className="text-xs text-gray-400">{TITLE_LIMIT - title.length} left</span>
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
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
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
            {errors.tag && <p className="mt-1 text-xs text-red-600">{errors.tag}</p>}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
            <div className="relative mt-1" ref={containerRef}>
              <div>
                <input
                  ref={inputRef}
                  id="location-search"
                  type="search"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value)
                    // open dropdown when user types
                    setIsOpen(true)
                    setActiveIndex(-1)
                  }}
                  onClick={() => {
                    // open on click and highlight nearest
                    if (!isOpen) openAndHighlightInitial()
                    else setIsOpen(true)
                  }}
                  onFocus={() => {
                    if (!isOpen) openAndHighlightInitial()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      if (!isOpen) return openAndHighlightInitial()
                      setActiveIndex((i) => {
                        const next = i + 1
                        return next >= sortedLocationOptions.length ? 0 : next
                      })
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      if (!isOpen) return openAndHighlightInitial()
                      setActiveIndex((i) => {
                        const next = i - 1
                        return next < 0 ? sortedLocationOptions.length - 1 : next
                      })
                    } else if (e.key === 'Enter') {
                      if (isOpen && activeIndex >= 0) {
                        e.preventDefault()
                        const opt = sortedLocationOptions[activeIndex]
                        if (opt) {
                          setLocation(opt.value)
                          setLocationSearch(opt.label)
                          setIsOpen(false)
                          setActiveIndex(-1)
                          inputRef.current?.focus()
                        }
                      }
                    } else if (e.key === 'Escape') {
                      setIsOpen(false)
                      setActiveIndex(-1)
                    }
                  }}
                  placeholder="Search locations"
                  aria-haspopup="listbox"
                  aria-expanded={isOpen}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">▾</span>

              {isOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10">
                  <div className="max-h-52 overflow-y-auto p-1" data-locations-list role="listbox" id="location-listbox">
                    {loadingBuildings && !buildingsError ? (
                      <div className="rounded-lg px-3 py-2 text-sm text-gray-500">Loading live campus locations...</div>
                    ) : sortedLocationOptions.length > 0 ? (
                      sortedLocationOptions.map((option, idx) => {
                        const active = activeIndex === idx || location === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            data-option-index={idx}
                            role="option"
                            aria-selected={active}
                            onClick={() => {
                              setLocation(option.value)
                              setLocationSearch(option.label)
                              setIsOpen(false)
                              setActiveIndex(-1)
                              inputRef.current?.focus()
                            }}
                            className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                              active ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span className="min-w-0 flex-1 break-words">{highlightMatch(option.label, locationSearch)}</span>
                            {location === option.value && <span className="text-xs font-medium">Selected</span>}
                          </button>
                        )
                      })
                    ) : (
                      <div className="rounded-lg px-3 py-2 text-sm text-gray-500">No matching locations</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
            {tag === 'study' && (
              <div className="mt-2">
                <RoomSuggestion
                  spots={spots}
                  selectedLocation={location}
                  onSelectLocation={(val) => {
                    setLocation(val)
                    setLocationSearch(val)
                    setIsOpen(false)
                    setActiveIndex(-1)
                  }}
                />
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
              <span className="min-w-6 text-center text-base font-semibold text-gray-900">{spots}</span>
              <button
                type="button"
                onClick={() => setSpots((s) => clampSpots(s + 1))}
                className="h-9 w-9 rounded-lg border border-gray-300 text-lg text-gray-600 hover:bg-gray-50"
                aria-label="Increase spots"
              >
                +
              </button>
            </div>
            {errors.spots && <p className="mt-1 text-xs text-red-600">{errors.spots}</p>}
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
                      active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {errors.expiry && <p className="mt-1 text-xs text-red-600">{errors.expiry}</p>}
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <Button type="submit" loading={submitting} className="w-full">Post activity</Button>
        </form>
      </div>
    </div>
  )
}
