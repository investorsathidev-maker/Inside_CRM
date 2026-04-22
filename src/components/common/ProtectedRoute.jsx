// ============================================================
// components/common/ProtectedRoute.jsx
//
// This component acts as a "guard" for protected pages.
// If user is not logged in → redirect to /login
// If user is logged in → show the page normally
// ============================================================

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  // While checking login status, show a loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          {/* Spinning circle */}
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Not logged in → redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Logged in → show the protected page
  return children
}

export default ProtectedRoute
