// ============================================================
// context/AuthContext.jsx — Authentication Context
//
// What is Context? It's like a "global variable" in React.
// Instead of passing user info to every component manually,
// we wrap the whole app in this AuthProvider and any component
// can access the logged-in user with useContext(AuthContext).
// ============================================================

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Create the context object
const AuthContext = createContext({})

// Custom hook to easily use auth context
// Usage in any component: const { user, profile, isAdmin } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}

// The Provider component wraps the whole app
// It manages the logged-in user state
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)      // Supabase auth user
  const [profile, setProfile] = useState(null) // Our profiles table data
  const [loading, setLoading] = useState(true) // True while checking login status

  // ---- LOAD USER PROFILE ----
  async function loadProfile(userId) {
    if (!userId) {
      setProfile(null)
      return
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!error && data) {
      setProfile(data)
    }
  }

  // ---- LISTEN FOR AUTH CHANGES ----
  // This runs when the component mounts (app starts)
  // It listens for login/logout events from Supabase
  useEffect(() => {
    // Check if user is already logged in (from previous session)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      loadProfile(currentUser?.id)
      setLoading(false)
    })

    // Subscribe to future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        await loadProfile(currentUser?.id)
        setLoading(false)
      }
    )

    // Cleanup: unsubscribe when component unmounts
    return () => subscription.unsubscribe()
  }, [])

  // ---- LOGIN ----
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  // ---- LOGOUT ----
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  // ---- COMPUTED VALUES ----
  const isAdmin = profile?.role === 'admin'
  const isSalesperson = profile?.role === 'salesperson'

  // Everything available to child components
  const value = {
    user,                 // Supabase auth user object
    profile,             // Our custom profile (has role, full_name, etc.)
    loading,             // True while checking auth status
    isAdmin,             // Boolean: is this user an admin?
    isSalesperson,       // Boolean: is this user a salesperson?
    signIn,              // Function to log in
    signOut,             // Function to log out
    refreshProfile: () => loadProfile(user?.id),  // Re-fetch profile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
