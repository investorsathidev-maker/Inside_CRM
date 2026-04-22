// ============================================================
// pages/dashboard/Dashboard.jsx — Main Dashboard
//
// Shows:
// - Key stats (total clients, conversions, payments)
// - Recent clients
// - Stage distribution
// - Quick action buttons
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, TrendingUp, CreditCard, Clock,
  ArrowRight, Plus, CheckCircle, AlertTriangle,
  Building2, UserCheck
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatINR, formatDate, getStageColor } from '../../lib/utils'

// ---- STAT CARD COMPONENT ----
// A reusable box showing one metric
function StatCard({ title, value, subtitle, icon: Icon, color, trend }) {
  const colorClasses = {
    green:  'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  }

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">{trend}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

// ---- STAGE BADGE ----
function StageBadge({ stage }) {
  return <span className={getStageColor(stage)}>{stage}</span>
}

function Dashboard() {
  const { isAdmin, user, profile } = useAuth()
  
  // State for all the data we'll load
  const [stats, setStats] = useState({
    totalClients: 0,
    onboarded: 0,
    paymentDue: 0,
    totalRevenue: 0,
  })
  const [recentClients, setRecentClients] = useState([])
  const [overduePayments, setOverduePayments] = useState([])
  const [loading, setLoading] = useState(true)

  // ---- LOAD DATA ----
  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      // Build query based on role
      let clientQuery = supabase.from('clients').select('*')
      
      // If salesperson, only show their clients
      if (!isAdmin) {
        clientQuery = clientQuery.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
      }

      const { data: clients } = await clientQuery

      // Calculate stats from the client data
      const totalClients   = clients?.length || 0
      const onboarded      = clients?.filter(c => c.stage !== 'Lead').length || 0
      const completed      = clients?.filter(c => c.stage === 'Completed').length || 0

      // Get recent 5 clients
      const recent = [...(clients || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)

      // Get overdue payments
      const { data: overdueData } = await supabase
        .from('payment_milestones')
        .select(`*, client:clients(full_name, phone)`)
        .eq('status', 'Overdue')
        .limit(5)

      // Get total revenue (paid payments)
      const { data: paidPayments } = await supabase
        .from('payment_milestones')
        .select('amount')
        .eq('status', 'Paid')

      const totalRevenue = paidPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      setStats({
        totalClients,
        onboarded,
        completed,
        totalRevenue,
      })
      setRecentClients(recent)
      setOverduePayments(overdueData || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // ---- LOADING STATE ----
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton loading UI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ---- PAGE HEADER ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            Welcome back, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isAdmin ? 'Admin Dashboard — All Teams' : 'Your sales overview for today'}
          </p>
        </div>
        
        {/* Quick actions */}
        <div className="flex gap-2">
          <Link to="/quotes/create" className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Create Quote
          </Link>
        </div>
      </div>

      {/* ---- STAT CARDS ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          subtitle="All time"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Onboarded"
          value={stats.onboarded}
          subtitle="Past onboarding stage"
          icon={UserCheck}
          color="green"
          trend={`${stats.totalClients > 0 ? Math.round((stats.onboarded / stats.totalClients) * 100) : 0}% conversion`}
        />
        <StatCard
          title="Completed"
          value={stats.completed || 0}
          subtitle="Deals closed"
          icon={CheckCircle}
          color="purple"
        />
        <StatCard
          title="Revenue Collected"
          value={formatINR(stats.totalRevenue)}
          subtitle="Total paid milestones"
          icon={CreditCard}
          color="orange"
        />
      </div>

      {/* ---- MAIN CONTENT GRID ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ---- RECENT CLIENTS (takes 2/3 width) ---- */}
        <div className="lg:col-span-2 card">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Clients</h2>
            <Link
              to="/clients"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentClients.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No clients yet. Create a quote to get started!</p>
              </div>
            ) : (
              recentClients.map(client => (
                <Link
                  key={client.id}
                  to={`/clients/${client.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 dark:text-primary-400 font-semibold text-sm">
                      {client.full_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {client.full_name}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {client.project_name || 'No project'} 
                      {client.plot_number && ` • Plot ${client.plot_number}`}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StageBadge stage={client.stage} />
                    <span className="text-gray-300 dark:text-gray-600 text-xs">
                      {formatDate(client.created_at)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* ---- OVERDUE PAYMENTS (takes 1/3 width) ---- */}
        <div className="card">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Overdue Payments</h2>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {overduePayments.length === 0 ? (
              <div className="p-6 text-center text-gray-400 dark:text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-green-500" />
                <p className="text-sm">All payments up to date! ✨</p>
              </div>
            ) : (
              overduePayments.map(payment => (
                <div key={payment.id} className="p-4">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {payment.client?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{payment.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-red-600 dark:text-red-400 font-semibold text-sm">
                      {formatINR(payment.amount)}
                    </span>
                    <span className="text-xs text-gray-400">
                      Due {formatDate(payment.due_date)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <Link
              to="/payments"
              className="btn-secondary w-full justify-center text-sm"
            >
              View All Payments
            </Link>
          </div>
        </div>
      </div>

      {/* ---- PIPELINE STAGES SUMMARY ---- */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Pipeline Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { stage: 'Lead', count: recentClients.filter(c => c.stage === 'Lead').length, color: 'bg-blue-500' },
            { stage: 'Onboarded', count: recentClients.filter(c => c.stage === 'Onboarded').length, color: 'bg-purple-500' },
            { stage: 'Payment', count: recentClients.filter(c => c.stage === 'Payment').length, color: 'bg-yellow-500' },
            { stage: 'Completed', count: recentClients.filter(c => c.stage === 'Completed').length, color: 'bg-green-500' },
          ].map(({ stage, count, color }) => (
            <div key={stage} className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className={`w-3 h-3 rounded-full ${color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stage}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
