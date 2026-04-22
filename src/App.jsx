// ============================================================
// App.jsx — Main Application Router
//
// This file defines all the pages (routes) in the app.
// Think of it like a table of contents for all pages.
//
// Route examples:
//   /login         → Login page (public)
//   /onboard       → Magic link page (public, for clients)
//   /dashboard     → Dashboard (requires login)
//   /clients       → Client list (requires login)
//   /clients/:id   → Individual client page (requires login)
// ============================================================

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/Layout/Layout'

// Public pages (no login needed)
import Login from './pages/auth/Login'
import MagicLink from './pages/onboarding/MagicLink'
import OnboardingForm from './pages/onboarding/OnboardingForm'

// Protected pages (login required)
import Dashboard from './pages/dashboard/Dashboard'
import ClientList from './pages/clients/ClientList'
import ClientDetail from './pages/clients/ClientDetail'
import CreateQuote from './pages/quotes/CreateQuote'
import Payments from './pages/payments/Payments'

function App() {
  return (
    // AuthProvider wraps everything so any component can access user info
    <AuthProvider>
      {/* Router enables navigation between pages */}
      <Router>
        <Routes>
          {/* ---- PUBLIC ROUTES ---- */}
          {/* Anyone can access these without logging in */}
          
          {/* Login page */}
          <Route path="/login" element={<Login />} />
          
          {/* Magic link page - client opens this from their link */}
          {/* URL will look like: yoursite.com/onboard?token=abc123 */}
          <Route path="/onboard" element={<MagicLink />} />
          
          {/* Onboarding form - multi-step form for client to fill */}
          <Route path="/onboarding/:token" element={<OnboardingForm />} />

          {/* ---- PROTECTED ROUTES ---- */}
          {/* Must be logged in to access these */}
          {/* Layout provides the sidebar + header shell */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Redirect root "/" to "/dashboard" */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Main dashboard */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Client management */}
            <Route path="clients" element={<ClientList />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            
            {/* Quote creation (generates magic link) */}
            <Route path="quotes/create" element={<CreateQuote />} />
            
            {/* Payment overview */}
            <Route path="payments" element={<Payments />} />
          </Route>
          
          {/* Catch-all: redirect unknown URLs to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
