import React from 'react'

export default function JoinToast({ name, emoji }) {
  return (
    <div className="max-w-xs rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-gray-900">{name} joined</div>
        <div className="text-lg">{emoji}</div>
      </div>
    </div>
  )
}
