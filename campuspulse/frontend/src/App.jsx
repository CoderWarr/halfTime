/**
 * App root — routing, auth-gated routes, and global toaster.
 */
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Toaster } from './components/ui/Toast'
import Auth from './pages/Auth'
import Feed from './pages/Feed'
import { useJoinNotifications } from './lib/social/useJoinNotifications'

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"
        aria-label="Loading"
      />
    </div>
  )
}

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function App() {
  const { user, loading } = useAuth()

  // Mount the join notifications hook once at app root so a single
  // subscription broadcasts lightweight realtime toasts to viewers.
  useJoinNotifications()

  if (loading) return <FullScreenSpinner />

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={user ? '/feed' : '/auth'} replace />}
        />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/feed"
          element={
            <ProtectedRoute user={user}>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
