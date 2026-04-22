// ============================================================
// components/Layout/Header.jsx — Top Navigation Bar
//
// Contains:
// - Hamburger menu button (mobile)
// - Page title
// - Dark mode toggle
// - User avatar
// ============================================================

import { useState, useEffect } from 'react'
import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../lib/utils'

function Header({ onMenuClick }) {
  const { profile } = useAuth()
  
  // ---- DARK MODE ----
  // Check if dark mode is currently active
  const [isDark, setIsDark] = useState(() => {
    // Read saved preference from localStorage
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return saved === 'true'
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Apply dark mode class to <html> element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', isDark.toString())
  }, [isDark])

  function toggleDarkMode() {
    setIsDark(prev => !prev)
  }

  return (
    <header className="
      sticky top-0 z-10
      h-16 px-4 lg:px-6
      bg-white dark:bg-gray-900
      border-b border-gray-200 dark:border-gray-800
      flex items-center justify-between
      shadow-sm
    ">
      {/* ---- LEFT SIDE ---- */}
      <div className="flex items-center gap-4">
        {/* Hamburger menu button (mobile only) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* App name on mobile */}
        <span className="lg:hidden font-bold text-gray-900 dark:text-white text-sm">
          Investor Sathi
        </span>
      </div>

      {/* ---- RIGHT SIDE ---- */}
      <div className="flex items-center gap-3">
        {/* ---- DARK MODE TOGGLE ---- */}
        <button
          onClick={toggleDarkMode}
          className="
            w-9 h-9 rounded-lg
            bg-gray-100 dark:bg-gray-800
            hover:bg-gray-200 dark:hover:bg-gray-700
            flex items-center justify-center
            text-gray-600 dark:text-gray-400
            transition-colors duration-200
          "
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-yellow-400" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* ---- NOTIFICATIONS BELL (placeholder) ---- */}
        <button className="
          w-9 h-9 rounded-lg relative
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          flex items-center justify-center
          text-gray-600 dark:text-gray-400
          transition-colors duration-200
        ">
          <Bell className="w-4 h-4" />
          {/* Red dot notification indicator */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* ---- USER AVATAR ---- */}
        <div className="flex items-center gap-2">
          <div className="
            w-9 h-9 rounded-full
            bg-primary-600
            flex items-center justify-center
          ">
            <span className="text-white text-sm font-semibold">
              {getInitials(profile?.full_name || 'U')}
            </span>
          </div>
          
          {/* Name (hidden on very small screens) */}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {profile?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
