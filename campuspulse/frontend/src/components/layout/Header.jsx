/**
 * Sticky top header for the Feed page. Shows the CampusPulse brand
 * on the left and a logout button on the right.
 */
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { toast } from '../ui/Toast'

export function Header() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await signOut()
      navigate('/auth', { replace: true })
    } catch (err) {
      toast.error(err.message ?? 'Could not log out.')
    }
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
      <span className="text-lg font-semibold tracking-tight text-indigo-600">
        CampusPulse
      </span>
      <Button variant="secondary" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  )
}
