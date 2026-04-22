// ============================================================
// pages/payments/Payments.jsx — Payments Overview Page
//
// Shows ALL payment milestones across all clients.
// Filter by: status (Pending/Paid/Overdue), date range
// Admins see all; salespersons see their clients' payments only.
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CreditCard, CheckCircle, Clock, AlertTriangle,
  Filter, TrendingUp, IndianRupee, Search
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  formatINR, formatDate, getPaymentColor, cn
} from '../../lib/utils'

const STATUS_TABS = ['All', 'Pending', 'Overdue', 'Paid']

function Payments() {
  const { user, isAdmin } = useAuth()
  const [milestones, setMilestones] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  // Summary stats
  const [stats, setStats] = useState({
    totalPending: 0,
    totalOverdue: 0,
    totalPaid: 0,
    amountPending: 0,
    amountOverdue: 0,
    amountPaid: 0,
  })

  useEffect(() => {
    loadPayments()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [milestones, statusFilter, searchTerm])

  async function loadPayments() {
    setLoading(true)
    try {
      // Get all milestones with client info
      let query = supabase
        .from('payment_milestones')
        .select(`
          *,
          client:clients!payment_milestones_client_id_fkey(
            id, full_name, phone, project_name, assigned_to, created_by
          )
        `)
        .order('due_date', { ascending: true })

      // Salesperson: only see their clients' payments
      // (We filter by client later since RLS handles this on clients table)

      const { data, error } = await query
      if (error) throw error

      let result = data || []

      // Additional client-side filter for salesperson
      if (!isAdmin) {
        result = result.filter(m =>
          m.client?.assigned_to === user.id ||
          m.client?.created_by === user.id
        )
      }

      setMilestones(result)

      // Calculate summary stats
      setStats({
        totalPending:  result.filter(m => m.status === 'Pending').length,
        totalOverdue:  result.filter(m => m.status === 'Overdue').length,
        totalPaid:     result.filter(m => m.status === 'Paid').length,
        amountPending: result.filter(m => m.status === 'Pending').reduce((s, m) => s + (m.amount || 0), 0),
        amountOverdue: result.filter(m => m.status === 'Overdue').reduce((s, m) => s + (m.amount || 0), 0),
        amountPaid:    result.filter(m => m.status === 'Paid').reduce((s, m) => s + (m.amount || 0), 0),
      })
    } catch (err) {
      console.error('Error loading payments:', err)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let result = [...milestones]

    if (statusFilter !== 'All') {
      result = result.filter(m => m.status === statusFilter)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(m =>
        m.client?.full_name?.toLowerCase().includes(term) ||
        m.name?.toLowerCase().includes(term) ||
        m.client?.project_name?.toLowerCase().includes(term)
      )
    }

    setFiltered(result)
  }

  // ---- Mark as paid ----
  async function markAsPaid(milestoneId) {
    try {
      await supabase
        .from('payment_milestones')
        .update({ status: 'Paid', paid_at: new Date().toISOString() })
        .eq('id', milestoneId)
      loadPayments()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  // ---- LOADING ----
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card h-24" />)}
        </div>
        {[1,2,3,4].map(i => <div key={i} className="card h-16" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ---- PAGE HEADER ---- */}
      <div>
        <h1 className="page-title">Payments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Track all payment milestones across your clients
        </p>
      </div>

      {/* ---- SUMMARY CARDS ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overdue */}
        <div className="card p-5 border-l-4 border-red-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {formatINR(stats.amountOverdue)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {stats.totalOverdue} milestone{stats.totalOverdue !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="card p-5 border-l-4 border-yellow-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {formatINR(stats.amountPending)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {stats.totalPending} milestone{stats.totalPending !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Paid */}
        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Collected</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatINR(stats.amountPaid)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {stats.totalPaid} paid
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ---- FILTERS ---- */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search by client name, project..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_TABS.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {status}
              {status !== 'All' && (
                <span className="ml-1.5 text-xs opacity-70">
                  {milestones.filter(m => m.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ---- PAYMENT LIST ---- */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No payments found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div
              key={m.id}
              className={cn(
                'card p-4 flex items-center gap-4',
                m.status === 'Overdue' && 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10'
              )}
            >
              {/* Status icon */}
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                m.status === 'Paid'    ? 'bg-green-100 dark:bg-green-900/30' :
                m.status === 'Overdue' ? 'bg-red-100 dark:bg-red-900/30' :
                'bg-gray-100 dark:bg-gray-800'
              )}>
                {m.status === 'Paid'
                  ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  : m.status === 'Overdue'
                  ? <AlertTriangle className="w-5 h-5 text-red-500" />
                  : <Clock className="w-5 h-5 text-gray-400" />}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/clients/${m.client?.id}`}
                    className="font-semibold text-sm text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {m.client?.full_name}
                  </Link>
                  <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{m.name}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {m.client?.project_name && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {m.client.project_name}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Due: {formatDate(m.due_date)}
                  </span>
                  {m.paid_at && (
                    <span className="text-xs text-green-500">
                      Paid: {formatDate(m.paid_at)}
                    </span>
                  )}
                </div>
              </div>

              {/* Right side: amount + status + action */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">{formatINR(m.amount)}</p>
                  <span className={`${getPaymentColor(m.status)} mt-0.5 inline-block`}>{m.status}</span>
                </div>

                {m.status !== 'Paid' && (
                  <button
                    onClick={() => markAsPaid(m.id)}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" /> Mark Paid
                  </button>
                )}

                {m.payment_proof_url && (
                  <a
                    href={m.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    Proof ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total shown */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Showing {filtered.length} of {milestones.length} payments
        </p>
      )}
    </div>
  )
}

export default Payments
