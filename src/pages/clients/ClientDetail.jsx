// ============================================================
// pages/clients/ClientDetail.jsx — Individual Client Page
//
// Shows everything about one client:
// - Personal & property details
// - Stage management
// - Payment milestones
// - Document links
// - Communication logs
// ============================================================

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, User,
  CreditCard, FileText, MessageSquare, Plus, CheckCircle,
  Clock, AlertTriangle, Upload, Edit2, Save, X
} from 'lucide-react'
import { supabase, uploadFile } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  formatDate, formatINR, getStageColor, getPaymentColor,
  getInitials, formatPhone, formatDateTime
} from '../../lib/utils'

// Stage progression order
const STAGES = ['Lead', 'Onboarded', 'Payment', 'Completed']

// ---- ADD MILESTONE MODAL ----
function AddMilestoneModal({ clientId, onClose, onAdded }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', amount: '', due_date: '', notes: ''
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('payment_milestones').insert({
        client_id: clientId,
        name: form.name,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
        notes: form.notes || null,
        status: 'Pending',
        created_by: user.id,
      })
      if (error) throw error
      onAdded()
      onClose()
    } catch (err) {
      alert('Error adding milestone: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Payment Milestone
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Milestone Name *</label>
            <input
              className="input-field"
              placeholder="e.g. Token Amount, 1st Installment"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="input-label">Amount (₹) *</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 500000"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="input-label">Due Date *</label>
            <input
              type="date"
              className="input-field"
              value={form.due_date}
              onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="input-label">Notes (Optional)</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Adding...' : 'Add Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- ADD NOTE MODAL ----
function AddNoteModal({ clientId, onClose, onAdded }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ type: 'note', subject: '', message: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('communication_logs').insert({
        client_id: clientId,
        type: form.type,
        subject: form.subject || null,
        message: form.message,
        created_by: user.id,
      })
      if (error) throw error
      onAdded()
      onClose()
    } catch (err) {
      alert('Error adding note: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Note / Log</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Type</label>
            <select
              className="input-field"
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            >
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div>
            <label className="input-label">Subject (Optional)</label>
            <input className="input-field" placeholder="Subject" value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Message *</label>
            <textarea className="input-field resize-none" rows={3} required
              placeholder="What happened in this interaction?"
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- MAIN COMPONENT ----
function ClientDetail() {
  const { id } = useParams()           // Get client ID from URL
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const [client, setClient] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [updatingStage, setUpdatingStage] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    loadClient()
  }, [id])

  async function loadClient() {
    setLoading(true)
    try {
      const { data: clientData, error } = await supabase
        .from('clients')
        .select(`*, assigned_profile:profiles!clients_assigned_to_fkey(full_name, phone)`)
        .eq('id', id)
        .single()

      if (error) throw error
      setClient(clientData)

      // Load payment milestones
      const { data: milestonesData } = await supabase
        .from('payment_milestones')
        .select('*')
        .eq('client_id', id)
        .order('due_date')

      setMilestones(milestonesData || [])

      // Load communication logs
      const { data: logsData } = await supabase
        .from('communication_logs')
        .select(`*, creator:profiles!communication_logs_created_by_fkey(full_name)`)
        .eq('client_id', id)
        .order('created_at', { ascending: false })

      setLogs(logsData || [])
    } catch (err) {
      console.error('Error loading client:', err)
    } finally {
      setLoading(false)
    }
  }

  // Update client stage
  async function updateStage(newStage) {
    setUpdatingStage(true)
    try {
      const { error } = await supabase
        .from('clients')
        .update({ stage: newStage })
        .eq('id', id)
      if (error) throw error
      setClient(prev => ({ ...prev, stage: newStage }))
    } catch (err) {
      alert('Error updating stage: ' + err.message)
    } finally {
      setUpdatingStage(false)
    }
  }

  // Mark milestone as paid
  async function markAsPaid(milestoneId) {
    try {
      const { error } = await supabase
        .from('payment_milestones')
        .update({ status: 'Paid', paid_at: new Date().toISOString() })
        .eq('id', milestoneId)
      if (error) throw error
      loadClient()
    } catch (err) {
      alert('Error marking as paid: ' + err.message)
    }
  }

  // Upload payment proof
  async function uploadProof(milestoneId, file) {
    try {
      const path = `payment-proofs/${id}/${milestoneId}-${file.name}`
      const url = await uploadFile('documents', path, file)
      await supabase
        .from('payment_milestones')
        .update({ payment_proof_url: url })
        .eq('id', milestoneId)
      loadClient()
    } catch (err) {
      alert('Error uploading proof: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32" />
        <div className="card p-6 h-40" />
        <div className="card p-6 h-60" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500">Client not found.</p>
        <Link to="/clients" className="btn-primary mt-4 inline-flex">← Back to Clients</Link>
      </div>
    )
  }

  const totalAmount = milestones.reduce((s, m) => s + (m.amount || 0), 0)
  const paidAmount  = milestones.filter(m => m.status === 'Paid').reduce((s, m) => s + (m.amount || 0), 0)

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">

      {/* ---- BACK BUTTON + HEADER ---- */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/clients')}
          className="mt-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">{client.full_name}</h1>
            <span className={getStageColor(client.stage)}>{client.stage}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {client.phone && `📞 ${client.phone}`}
            {client.email && ` • ✉️ ${client.email}`}
          </p>
        </div>
      </div>

      {/* ---- STAGE PROGRESSION BAR ---- */}
      <div className="card p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium uppercase tracking-wide">
          Client Stage
        </p>
        <div className="flex items-center gap-1">
          {STAGES.map((stage, index) => {
            const currentIndex = STAGES.indexOf(client.stage)
            const isCompleted = index < currentIndex
            const isCurrent   = index === currentIndex
            const isNext      = index === currentIndex + 1

            return (
              <div key={stage} className="flex items-center flex-1">
                <button
                  onClick={() => (isNext || isAdmin) && updateStage(stage)}
                  disabled={updatingStage || (!isNext && !isAdmin)}
                  className={`
                    flex-1 py-2 px-3 rounded-lg text-xs font-medium text-center
                    transition-all duration-200
                    ${isCompleted ? 'bg-primary-600 text-white' : ''}
                    ${isCurrent  ? 'bg-primary-700 text-white ring-2 ring-primary-400 ring-offset-2 dark:ring-offset-gray-900' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' : ''}
                    ${isNext || isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                  `}
                >
                  {isCompleted && '✓ '}
                  {stage}
                </button>
                {index < STAGES.length - 1 && (
                  <div className={`h-0.5 w-2 ${index < currentIndex ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {isAdmin ? 'Admin: click any stage to update' : 'Click next stage to advance client'}
        </p>
      </div>

      {/* ---- TABS ---- */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'details',  label: 'Details', icon: User },
          { id: 'payments', label: `Payments (${milestones.length})`, icon: CreditCard },
          { id: 'logs',     label: `Activity (${logs.length})`, icon: MessageSquare },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
              ${activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}
            `}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ---- TAB: DETAILS ---- */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Personal Details */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-500" /> Personal Details
            </h3>
            <dl className="space-y-3">
              {[
                { label: 'Full Name',   value: client.full_name },
                { label: 'Phone',       value: formatPhone(client.phone) },
                { label: 'Email',       value: client.email },
                { label: 'Age Range',   value: client.age_range },
                { label: 'Occupation',  value: client.occupation },
                { label: 'City',        value: client.city },
                { label: 'Investment',  value: client.investment_status },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white text-right">
                    {value || <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Property Details */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-500" /> Property Details
            </h3>
            <dl className="space-y-3">
              {[
                { label: 'Project',          value: client.project_name },
                { label: 'Plot Number',      value: client.plot_number },
                { label: 'Owner Name',       value: client.plot_owner_name },
                { label: 'Owner Phone',      value: formatPhone(client.plot_owner_phone) },
                { label: 'Owner Email',      value: client.plot_owner_email },
                { label: 'Owner Gender',     value: client.plot_owner_gender },
                { label: 'Assigned To',      value: client.assigned_profile?.full_name },
                { label: 'Joined',           value: formatDate(client.created_at) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white text-right">
                    {value || <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Documents */}
          <div className="card p-5 md:col-span-2">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" /> Documents
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'PAN Card',    url: client.pan_card_url },
                { label: 'Aadhaar Card', url: client.aadhaar_card_url },
              ].map(({ label, url }) => (
                <div key={label} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                  <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 text-xs hover:underline mt-1 block">
                      View Document ↗
                    </a>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Not uploaded</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- TAB: PAYMENTS ---- */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Payment summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatINR(totalAmount)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Collected</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatINR(paidAmount)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pending</p>
              <p className="text-xl font-bold text-orange-500">{formatINR(totalAmount - paidAmount)}</p>
            </div>
          </div>

          {/* Add milestone button */}
          <div className="flex justify-end">
            <button onClick={() => setShowMilestoneModal(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Add Milestone
            </button>
          </div>

          {/* Milestones list */}
          {milestones.length === 0 ? (
            <div className="card p-10 text-center">
              <CreditCard className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No payment milestones yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map(m => (
                <div key={m.id} className="card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${m.status === 'Paid' ? 'bg-green-100 dark:bg-green-900/30' :
                          m.status === 'Overdue' ? 'bg-red-100 dark:bg-red-900/30' :
                          'bg-gray-100 dark:bg-gray-800'}`}>
                        {m.status === 'Paid'
                          ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          : m.status === 'Overdue'
                          ? <AlertTriangle className="w-4 h-4 text-red-500" />
                          : <Clock className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{m.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Due: {formatDate(m.due_date)}
                          {m.paid_at && ` • Paid: ${formatDate(m.paid_at)}`}
                        </p>
                        {m.notes && <p className="text-xs text-gray-400 mt-1">{m.notes}</p>}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 dark:text-white">{formatINR(m.amount)}</p>
                      <span className={`${getPaymentColor(m.status)} mt-1 inline-block`}>{m.status}</span>
                    </div>
                  </div>

                  {/* Actions row */}
                  {m.status !== 'Paid' && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => markAsPaid(m.id)}
                        className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Mark Paid
                      </button>
                      <span className="text-gray-200 dark:text-gray-700">|</span>
                      <label className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" /> Upload Proof
                        <input type="file" className="hidden" accept="image/*,.pdf"
                          onChange={e => e.target.files?.[0] && uploadProof(m.id, e.target.files[0])} />
                      </label>
                      {m.payment_proof_url && (
                        <>
                          <span className="text-gray-200 dark:text-gray-700">|</span>
                          <a href={m.payment_proof_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:underline">View Proof ↗</a>
                        </>
                      )}
                    </div>
                  )}
                  {m.status === 'Paid' && m.payment_proof_url && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <a href={m.payment_proof_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                        View Payment Proof ↗
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- TAB: ACTIVITY LOGS ---- */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNoteModal(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="card p-10 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No activity logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => {
                const typeColors = {
                  note:      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                  call:      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                  email:     'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                  whatsapp:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                }
                return (
                  <div key={log.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <span className={`badge capitalize ${typeColors[log.type] || typeColors.note} flex-shrink-0 mt-0.5`}>
                        {log.type}
                      </span>
                      <div className="flex-1">
                        {log.subject && (
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{log.subject}</p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{log.message}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {log.creator?.full_name && `By ${log.creator.full_name} • `}
                          {formatDateTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ---- MODALS ---- */}
      {showMilestoneModal && (
        <AddMilestoneModal
          clientId={id}
          onClose={() => setShowMilestoneModal(false)}
          onAdded={loadClient}
        />
      )}
      {showNoteModal && (
        <AddNoteModal
          clientId={id}
          onClose={() => setShowNoteModal(false)}
          onAdded={loadClient}
        />
      )}
    </div>
  )
}

export default ClientDetail
