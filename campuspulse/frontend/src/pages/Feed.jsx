/**
 * Feed page — the main screen. Stages 3-6 fill in the activity feed,
 * tag filter, and create modal.
 */
import { Header } from '../components/layout/Header'

export default function Feed() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-sm text-gray-500">
          Feed coming soon. Activity cards will live here.
        </p>
      </main>
    </div>
  )
}
