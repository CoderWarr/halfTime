/**
 * Tag definitions for activities. Every tag pill, filter, and selector
 * across the app reads from this list. Class strings are written in full
 * so Tailwind can statically detect them at build time.
 */
export const TAGS = [
  {
    value: 'study',
    label: 'Study',
    pill: 'bg-blue-100 text-blue-700',
    pillActive: 'bg-blue-600 text-white',
  },
  {
    value: 'sports',
    label: 'Sports',
    pill: 'bg-green-100 text-green-700',
    pillActive: 'bg-green-600 text-white',
  },
  {
    value: 'food',
    label: 'Food',
    pill: 'bg-orange-100 text-orange-700',
    pillActive: 'bg-orange-600 text-white',
  },
  {
    value: 'social',
    label: 'Social',
    pill: 'bg-purple-100 text-purple-700',
    pillActive: 'bg-purple-600 text-white',
  },
  {
    value: 'chill',
    label: 'Chill',
    pill: 'bg-gray-100 text-gray-600',
    pillActive: 'bg-gray-600 text-white',
  },
]

export const TAG_MAP = Object.fromEntries(TAGS.map((t) => [t.value, t]))
