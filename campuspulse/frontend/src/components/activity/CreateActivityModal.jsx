/**
 * Modal for posting a new activity. Handles form state, inline validation,
 * and the Supabase insert. Renders RoomSuggestion for study activities.
 * Closes on backdrop click, the × button, or the Escape key.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useDevSocBuildings } from '../../hooks/useDevSocBuildings'
import { TAGS } from '../../constants/tags'
import {
  CAMPUS_LOCATIONS,
  MANUAL_CAMPUS_LOCATIONS,
} from '../../constants/locations'
import { generateMapUrl } from '../../lib/maps/mapLinkGenerator'
import {
  CURRENT_LOCATION_VALUE,
  encodeDynamicLocationLabel,
  getCurrentPosition,
  reverseGeocodeCoordinates,
} from '../../lib/maps/currentLocation'
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
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const mountedRef = useRef(true)
  const [spots, setSpots] = useState(4)
  const [expiryMs, setExpiryMs] = useState(EXPIRY_OPTIONS[1].ms)
  const [currentLocationStatus, setCurrentLocationStatus] = useState('idle')
  const [currentLocationError, setCurrentLocationError] = useState('')
  const [currentLocationPreview, setCurrentLocationPreview] = useState('')

  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    mountedRef.current = true
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      mountedRef.current = false
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  function validate() {
    const next = {}
    if (!title.trim()) next.title = 'Title is required.'
    if (!tag) next.tag = 'Pick a tag.'
    if (!selectedLocation) next.location = 'Pick a location.'
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
    const locationPayload = selectedLocation ?? {}
    const { error } = await supabase.from('activities').insert({
      title: title.trim(),
      tag,
      location_label: locationPayload.storageLabel || locationPayload.label || locationSearch.trim(),
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

  const filteredLocationOptions = [...liveBuildingOptions, ...manualLocationOptions].filter((option) =>
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

  const locationOptions = useMemo(() => ([
    {
      value: CURRENT_LOCATION_VALUE,
      label: '📍 Use my current location',
      kind: 'current',
      isSelected: selectedLocation?.value === CURRENT_LOCATION_VALUE,
      status: currentLocationStatus,
      error: currentLocationError,
      preview: currentLocationPreview,
    },
    ...sortedLocationOptions.map((option) => ({
      ...option,
      kind: 'regular',
      isSelected: selectedLocation?.value === option.value,
    })),
  ]), [currentLocationError, currentLocationPreview, currentLocationStatus, selectedLocation?.value, sortedLocationOptions])

  // Helpers for keyboard navigation and scrolling
  function openAndHighlightInitial() {
    setIsOpen(true)
    const query = locationSearch.trim().toLowerCase()
    if (!query) {
      setActiveIndex(locationOptions.length > 0 ? 0 : -1)
      return
    }

    const firstMatch = locationOptions.findIndex((opt, idx) =>
      idx > 0 && (opt.label.toLowerCase().startsWith(query) || opt.value.toLowerCase().startsWith(query)),
    )
    if (firstMatch !== -1) setActiveIndex(firstMatch)
    else setActiveIndex(locationOptions.length > 0 ? 0 : -1)
  }

  async function selectCurrentLocation() {
    if (currentLocationStatus === 'loading') return

    setCurrentLocationError('')
    setCurrentLocationStatus('loading')

    try {
      const position = await getCurrentPosition()
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude
      const readableLabel = (await reverseGeocodeCoordinates(latitude, longitude)) || 'Current location'
      const mapUrl = generateMapUrl({ lat: latitude, lng: longitude })

      if (!mountedRef.current) return

      const nextLocation = {
        value: CURRENT_LOCATION_VALUE,
        label: readableLabel,
        storageLabel: encodeDynamicLocationLabel(readableLabel, latitude, longitude),
        latitude,
        longitude,
        mapUrl,
        isDynamicLocation: true,
      }

      setSelectedLocation(nextLocation)
      setLocationSearch(readableLabel)
      setCurrentLocationPreview(readableLabel)
      setCurrentLocationStatus('ready')
      setIsOpen(false)
      setActiveIndex(-1)
      inputRef.current?.focus()
    } catch (error) {
      if (!mountedRef.current) return

      const message = error?.code === error?.PERMISSION_DENIED
        ? 'Location permission denied. Enable access to use your current location.'
        : error?.code === error?.POSITION_UNAVAILABLE
          ? 'Could not determine your current location.'
          : error?.code === error?.TIMEOUT
            ? 'Location lookup timed out. Try again.'
            : error?.message || 'Could not get your current location.'

      setCurrentLocationError(message)
      setCurrentLocationStatus('error')
      setIsOpen(true)
      setActiveIndex(0)
    }
  }

  useEffect(() => {
    if (activeIndex < 0) return
    const list = containerRef.current?.querySelector('[data-locations-list]')
    const item = list?.querySelector(`[data-option-index="${activeIndex}"]`)
    if (item) item.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeIndex, locationOptions])

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
                    setSelectedLocation(null)
                    setCurrentLocationError('')
                    if (currentLocationStatus === 'error') setCurrentLocationStatus('idle')
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
                        return next >= locationOptions.length ? 0 : next
                      })
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      if (!isOpen) return openAndHighlightInitial()
                      setActiveIndex((i) => {
                        const next = i - 1
                        return next < 0 ? locationOptions.length - 1 : next
                      })
                    } else if (e.key === 'Enter') {
                      if (isOpen && activeIndex >= 0) {
                        e.preventDefault()
                        const opt = locationOptions[activeIndex]
                        if (opt) {
                          if (opt.kind === 'current') {
                            void selectCurrentLocation()
                          } else {
                            setSelectedLocation({ value: opt.value, label: opt.label, storageLabel: opt.label })
                            setLocationSearch(opt.label)
                            setCurrentLocationError('')
                            setCurrentLocationStatus('idle')
                            setIsOpen(false)
                            setActiveIndex(-1)
                            inputRef.current?.focus()
                          }
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
                    <button
                      type="button"
                      data-option-index={0}
                      role="option"
                      aria-selected={locationOptions[0]?.isSelected ?? false}
                      disabled={currentLocationStatus === 'loading'}
                      onClick={() => void selectCurrentLocation()}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                        locationOptions[0]?.isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : currentLocationStatus === 'error'
                            ? 'border border-red-200 bg-red-50 text-red-900 hover:bg-red-100'
                            : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
                      } ${currentLocationStatus === 'loading' ? 'cursor-wait opacity-80' : ''}`}
                    >
                      <span className="mt-0.5 text-base leading-none">📍</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-medium">
                          <span>{currentLocationStatus === 'loading' ? 'Locating...' : 'Use my current location'}</span>
                          {locationOptions[0]?.isSelected && (
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                              Selected
                            </span>
                          )}
                        </span>
                        {currentLocationStatus === 'loading' ? (
                          <span className="mt-1 flex items-center gap-2 text-xs opacity-80">
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                            Requesting location permission...
                          </span>
                        ) : currentLocationStatus === 'error' ? (
                          <span className="mt-1 block text-xs leading-5">
                            {currentLocationError}
                            <span className="ml-1 font-medium underline">Retry</span>
                          </span>
                        ) : currentLocationPreview ? (
                          <span className={`mt-1 block text-xs ${locationOptions[0]?.isSelected ? 'text-white/80' : 'text-indigo-700'}`}>
                            {currentLocationPreview}
                          </span>
                        ) : (
                          <span className={`mt-1 block text-xs ${locationOptions[0]?.isSelected ? 'text-white/80' : 'text-indigo-700'}`}>
                            Uses your browser location and opens exact map links.
                          </span>
                        )}
                      </span>
                    </button>

                    <div className="my-1 h-px bg-gray-100" />

                    {loadingBuildings && !buildingsError ? (
                      <div className="rounded-lg px-3 py-2 text-sm text-gray-500">Loading live campus locations...</div>
                    ) : sortedLocationOptions.length > 0 ? (
                      sortedLocationOptions.map((option, idx) => {
                        const optionIndex = idx + 1
                        const active = activeIndex === optionIndex || selectedLocation?.value === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            data-option-index={optionIndex}
                            role="option"
                            aria-selected={active}
                            onClick={() => {
                              setSelectedLocation({ value: option.value, label: option.label, storageLabel: option.label })
                              setLocationSearch(option.label)
                              setCurrentLocationError('')
                              setCurrentLocationStatus('idle')
                              setIsOpen(false)
                              setActiveIndex(-1)
                              inputRef.current?.focus()
                            }}
                            className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                              active ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span className="min-w-0 flex-1 break-words">{highlightMatch(option.label, locationSearch)}</span>
                            {selectedLocation?.value === option.value && <span className="text-xs font-medium">Selected</span>}
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
                  selectedLocation={selectedLocation?.label || ''}
                  onSelectLocation={(val) => {
                    setSelectedLocation({ value: val, label: val, storageLabel: val })
                    setLocationSearch(val)
                    setCurrentLocationError('')
                    setCurrentLocationStatus('idle')
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
