// ============================================================
// components/Layout/Layout.jsx — Main App Shell
//
// This wraps all protected pages with:
// - Sidebar (left navigation)
// - Header (top bar)
// - Main content area (right side)
//
// The <Outlet /> is where child route pages render.
// ============================================================

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

function Layout() {
  // Controls sidebar open/closed state on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* ---- SIDEBAR ---- */}
      {/* On desktop: always visible on the left */}
      {/* On mobile: hidden by default, slides in when sidebarOpen=true */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ---- MAIN CONTENT AREA ---- */}
      {/* flex-1 means "take all remaining space" */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        {/* overflow-y-auto allows scrolling within the content area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          {/* <Outlet /> renders the current route's page component */}
          {/* e.g., if URL is /dashboard, renders <Dashboard /> */}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
