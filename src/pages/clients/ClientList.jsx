// ============================================================
// pages/clients/ClientList.jsx — All Clients Page
//
// Shows a searchable, filterable table/list of all clients.
// Admins see all; salespersons see only their own.
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Filter, ArrowRight, Users,
  Phone, Mail, MapPin, Building2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatDate, getStageColor, getInitials, cn } from '../../lib/utils'

// Stage options for filter
const STAGES = ['All', 'Lead', 'Onboarded', 'Payment', 'Completed']

function ClientList() {
  const { user, isAdmin } = useAuth()
  const [clients, setClients] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [salespersonFilter, setSalespersonFilter] = useState('All')
  const [salespersons, setSalespersons] = useState([])

  // Load clients on component mount
  useEffect(() => {
    loadClients()
  }, [])

  // Apply filters whenever search/filter values change
  useEffect(() => {
    applyFilters()
  }, [searchTerm, stageFilter, salespersonFilter, clients])

  async function loadClients() {
    setLoading(true)
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          assigned_profile:profiles!clients_assigned_to_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
      
      // Salesperson: only see own clients
      if (!isAdmin) {
        query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      setClients(data || [])
      
      // Extract unique salespersons for filter dropdown
      if (isAdmin) {
        const unique = [...new Map(
          data?.filter(c => c.assigned_profile)
              .map(c => [c.assigned_to, { id: c.assigned_to, name: c.assigned_profile?.full_name }])
        ).values()]
        setSalespersons(unique)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let result = [...clients]
    
    // Search filter (name, phone, email, project)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(c =>
        c.full_name?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.project_name?.toLowerCase().includes(term) ||
        c.plot_number?.toLowerCase().includes(term)
      )
    }
    
    // Stage filter
    if (stageFilter !== 'All') {
      result = result.filter(c => c.stage === stageFilter)
    }
    
    // Salesperson filter (admin only)
    if (salespersonFilter !== 'All') {
      result = result.filter(c => c.assigned_to === salespersonFilter)
    }
    
    setFiltered(result)
  }

  // ---- LOADING SKELETON ----
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-pulse" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-40" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* ---- PAGE HEADER ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {filtered.length} of {clients.length} clients
          </p>
        </div>
        <Link to="/quotes/create" className="btn-primary text-sm self-start sm:self-auto">
          + Create Quote
        </Link>
      </div>

      {/* ---- FILTERS BAR ---- */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, project..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          
          {/* Stage filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="input-field w-auto min-w-[130px]"
            >
              {STAGES.map(s => (
                <option key={s} value={s}>Stage: {s}</option>
              ))}
            </select>
          </div>
          
          {/* Salesperson filter (admin only) */}
          {isAdmin && salespersons.length > 0 && (
            <select
              value={salespersonFilter}
              onChange={e => setSalespersonFilter(e.target.value)}
              className="input-field w-auto min-w-[150px]"
            >
              <option value="All">All Salespersons</option>
              {salespersons.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ---- STAGE QUICK FILTER PILLS ---- */}
      <div className="flex gap-2 flex-wrap">
        {STAGES.map(stage => (
          <button
            key={stage}
            onClick={() => setStageFilter(stage)}
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium transition-all duration-200',
              stageFilter === stage
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary-300'
            )}
          >
            {stage}
            {/* Show count for each stage */}
            <span className="ml-1.5 text-xs opacity-70">
              {stage === 'All' 
                ? clients.length 
                : clients.filter(c => c.stage === stage).length}
            </span>
          </button>
        ))}
      </div>

      {/* ---- CLIENT LIST ---- */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || stageFilter !== 'All'
              ? 'No clients match your filters'
              : 'No clients yet. Create a quote to get started!'}
          </p>
          {clients.length === 0 && (
            <Link to="/quotes/create" className="btn-primary mt-4 inline-flex">
              + Create First Quote
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => (
            <Link
              key={client.id}
              to={`/clients/${client.id}`}
              className="card flex items-center gap-4 p-4 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200 group"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 dark:text-primary-400 font-bold text-sm">
                  {getInitials(client.full_name)}
                </span>
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {client.full_name}
                  </h3>
                  <span className={getStageColor(client.stage)}>{client.stage}</span>
                </div>
                
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {client.phone && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {client.phone}
                    </span>
                  )}
                  {client.city && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {client.city}
                    </span>
                  )}
                  {client.project_name && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {client.project_name}
                      {client.plot_number && ` • Plot ${client.plot_number}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Right side info */}
              <div className="flex-shrink-0 text-right hidden sm:block">
                {client.assigned_profile && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                    {client.assigned_profile.full_name}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(client.created_at)}
                </p>
              </div>

              <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClientList
