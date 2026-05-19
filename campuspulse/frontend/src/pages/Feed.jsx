/**
 * Feed page — main app screen. Assembles the header, tag filter, activity
 * feed, floating action button, and the create-activity modal.
 */
import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { TagFilter } from '../components/filters/TagFilter'
import { ActivityFeed } from '../components/activity/ActivityFeed'
import { CreateActivityModal } from '../components/activity/CreateActivityModal'

export default function Feed() {
  const [activeTag, setActiveTag] = useState(null)
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TagFilter activeTag={activeTag} onTagChange={setActiveTag} />

      <main className="mx-auto max-w-2xl px-4 py-4 pb-28">
        <ActivityFeed activeTag={activeTag} />
      </main>

      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-20 flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:bg-indigo-700 active:scale-95"
      >
        <span className="text-lg leading-none">+</span>
        Post Activity
      </button>

      {showModal && (
        <CreateActivityModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
