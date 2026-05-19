import React from 'react'

const TAG_COLOR = {
  study: 'bg-blue-500',
  sports: 'bg-green-500',
  food: 'bg-orange-500',
  social: 'bg-purple-500',
  chill: 'bg-gray-500',
}

export default function JoinToast({ name, tag }) {
  const color = TAG_COLOR[tag] || 'bg-gray-300'
  return (
    <div className="max-w-xs rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 shrink-0 rounded-full ${color}`} />
        <div className="text-sm font-medium text-gray-900">{name} joined</div>
      </div>
    </div>
  )
}
