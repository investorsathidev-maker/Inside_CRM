// ============================================================
// components/Layout/Sidebar.jsx — Left Navigation Sidebar
//
// Contains all navigation links.
// Shows different items based on user role.
// Collapses on mobile.
// ============================================================

import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  LogOut,
  X,
  Building2,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn, getInitials } from '../../lib/utils'

// Navigation items definition
const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: Users,
  },
  {
    label: 'Create Quote',
    href: '/quotes/create',
    icon: FileText,
  },
  {
    label: 'Payments',
    href: '/payments',
    icon: CreditCard,
  },
]

function Sidebar({ isOpen, onClose }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* ---- MOBILE OVERLAY ---- */}
      {/* Dark background behind sidebar on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* ---- SIDEBAR PANEL ---- */}
      <aside
        className={cn(
          // Base styles
          'fixed top-0 left-0 h-full z-30 w-64',
          'bg-gray-900 dark:bg-gray-950',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          // Desktop: always visible
          'lg:translate-x-0 lg:static lg:z-auto',
          // Mobile: slide in/out
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ---- LOGO SECTION ---- */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {/* Logo icon */}
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">Investor</h1>
              <h1 className="text-primary-400 font-bold text-sm leading-tight">Sathi CRM</h1>
            </div>
          </div>
          
          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ---- NAVIGATION LINKS ---- */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onClose} // Close sidebar on mobile after clicking
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                  'text-sm font-medium transition-all duration-200',
                  'group',
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  )} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ---- USER PROFILE SECTION (Bottom) ---- */}
        <div className="p-4 border-t border-gray-700">
          {/* User info */}
          <div className="flex items-center gap-3 mb-3 px-2">
            {/* Avatar with initials */}
            <div className="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {getInitials(profile?.full_name || 'User')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-gray-400 text-xs capitalize">
                {profile?.role || 'salesperson'}
              </p>
            </div>
          </div>
          
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
              'text-gray-400 hover:text-red-400 hover:bg-red-900/20',
              'text-sm font-medium transition-all duration-200'
            )}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
