// ============================================================
// pages/quotes/CreateQuote.jsx — Create Quote + Magic Link
//
// Salesperson fills in client + deal details.
// System generates a unique magic link.
// Salesperson copies and sends it to client via WhatsApp/Email.
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Link2, Copy, CheckCircle, ArrowLeft,
  Send, MessageSquare, Mail, AlertCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatINR, copyToClipboard } from '../../lib/utils'

// ---- VALIDATION SCHEMA ----
const quoteSchema = z.object({
  client_name:  z.string().min(2, 'Name must be at least 2 characters'),
  client_phone: z.string().min(10, 'Enter a valid 10-digit phone number'),
  client_email: z.string().email('Invalid email').optional().or(z.literal('')),
  project_name: z.string().min(2, 'Project name is required'),
  plot_number:  z.string().optional(),
  plot_size:    z.string().optional(),
  total_amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  token_amount: z.coerce.number().optional(),
  notes:        z.string().optional(),
})

function CreateQuote() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [quote, setQuote] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({ resolver: zodResolver(quoteSchema) })

  // Watch form values for preview
  const watchedAmount = watch('total_amount')
  const watchedProject = watch('project_name')
  const watchedClientName = watch('client_name')

  // ---- FORM SUBMISSION ----
  async function onSubmit(data) {
    setIsLoading(true)
    setError('')

    try {
      // Step 1: Insert the quote into database
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          client_name:  data.client_name,
          client_phone: data.client_phone,
          client_email: data.client_email || null,
          project_name: data.project_name,
          plot_number:  data.plot_number || null,
          plot_size:    data.plot_size || null,
          total_amount: data.total_amount,
          token_amount: data.token_amount || null,
          notes:        data.notes || null,
          created_by:   user.id,
          status:       'pending',
        })
        .select()
        .single()

      if (quoteError) throw quoteError

      // Step 2: Generate a unique onboarding token for this quote
      const { data: tokenData, error: tokenError } = await supabase
        .from('onboarding_tokens')
        .insert({ quote_id: quoteData.id })
        .select()
        .single()

      if (tokenError) throw tokenError

      // Step 3: Build the magic link URL
      const baseUrl = window.location.origin
      const magicLink = `${baseUrl}/onboarding/${tokenData.token}`

      setGeneratedLink(magicLink)
      setQuote(quoteData)

    } catch (err) {
      console.error('Error creating quote:', err)
      setError('Failed to create quote: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ---- COPY LINK ----
  async function handleCopy() {
    const success = await copyToClipboard(generatedLink)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  // ---- SHARE VIA WHATSAPP ----
  function shareWhatsApp() {
    if (!quote) return
    const message = encodeURIComponent(
      `Dear ${quote.client_name},\n\nThank you for your interest in *${quote.project_name}*!\n\n` +
      `Please complete your onboarding using this secure link:\n${generatedLink}\n\n` +
      `This link will expire in 7 days.\n\nRegards,\nInvestor Sathi Team`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  // ---- SHARE VIA EMAIL ----
  function shareEmail() {
    if (!quote) return
    const subject = encodeURIComponent(`Your Onboarding Link - ${quote.project_name}`)
    const body = encodeURIComponent(
      `Dear ${quote.client_name},\n\nThank you for your interest in ${quote.project_name}.\n\n` +
      `Please complete your onboarding by clicking the link below:\n\n${generatedLink}\n\n` +
      `This link will expire in 7 days.\n\nBest regards,\nInvestor Sathi Team`
    )
    window.open(`mailto:${quote.client_email || ''}?subject=${subject}&body=${body}`)
  }

  // ---- SUCCESS STATE (after quote created) ----
  if (generatedLink && quote) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

        {/* Success header */}
        <div className="card p-6 text-center border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Quote Created Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Share the magic link below with <strong>{quote.client_name}</strong>
          </p>
        </div>

        {/* Quote summary */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quote Summary</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Client',   value: quote.client_name },
              { label: 'Phone',    value: quote.client_phone },
              { label: 'Project',  value: quote.project_name },
              { label: 'Plot',     value: quote.plot_number || '—' },
              { label: 'Amount',   value: formatINR(quote.total_amount) },
              { label: 'Token',    value: quote.token_amount ? formatINR(quote.token_amount) : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-gray-400 dark:text-gray-500 text-xs">{label}</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Magic link box */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Client Onboarding Link</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            This is a unique, secure link. Share it only with <strong>{quote.client_name}</strong>.
            It expires in <strong>7 days</strong>.
          </p>

          {/* Link display + copy */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <code className="flex-1 text-xs text-primary-600 dark:text-primary-400 break-all font-mono">
              {generatedLink}
            </code>
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${copied
                  ? 'bg-green-500 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
            >
              {copied ? (
                <><CheckCircle className="w-3 h-3" /> Copied!</>
              ) : (
                <><Copy className="w-3 h-3" /> Copy</>
              )}
            </button>
          </div>

          {/* Share buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={shareWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Send via WhatsApp
            </button>
            {quote.client_email && (
              <button
                onClick={shareEmail}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                  bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send via Email
              </button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => { setGeneratedLink(''); setQuote(null) }}
            className="btn-secondary flex-1 justify-center"
          >
            Create Another Quote
          </button>
          <button
            onClick={() => navigate('/clients')}
            className="btn-primary flex-1 justify-center"
          >
            Go to Clients
          </button>
        </div>
      </div>
    )
  }

  // ---- FORM STATE ----
  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">Create Quote</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Fill in the details to generate a client onboarding link
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="card p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Main form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* CLIENT INFORMATION */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Client Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Client Full Name *</label>
              <input className="input-field" placeholder="e.g. Priya Mehta" {...register('client_name')} />
              {errors.client_name && <p className="text-red-500 text-xs mt-1">{errors.client_name.message}</p>}
            </div>
            <div>
              <label className="input-label">Phone Number *</label>
              <input className="input-field" placeholder="10-digit mobile number" {...register('client_phone')} />
              {errors.client_phone && <p className="text-red-500 text-xs mt-1">{errors.client_phone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Email Address (Optional)</label>
              <input type="email" className="input-field" placeholder="client@email.com" {...register('client_email')} />
              {errors.client_email && <p className="text-red-500 text-xs mt-1">{errors.client_email.message}</p>}
            </div>
          </div>
        </div>

        {/* PROPERTY DETAILS */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            Property Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Project Name *</label>
              <input className="input-field" placeholder="e.g. Green Valley Phase 2" {...register('project_name')} />
              {errors.project_name && <p className="text-red-500 text-xs mt-1">{errors.project_name.message}</p>}
            </div>
            <div>
              <label className="input-label">Plot Number</label>
              <input className="input-field" placeholder="e.g. A-42" {...register('plot_number')} />
            </div>
            <div>
              <label className="input-label">Plot Size</label>
              <input className="input-field" placeholder="e.g. 200 sq yards" {...register('plot_size')} />
            </div>
          </div>
        </div>

        {/* PRICING */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            Pricing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Total Amount (₹) *</label>
              <input type="number" className="input-field" placeholder="e.g. 2500000" {...register('total_amount')} />
              {watchedAmount && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatINR(watchedAmount)}</p>
              )}
              {errors.total_amount && <p className="text-red-500 text-xs mt-1">{errors.total_amount.message}</p>}
            </div>
            <div>
              <label className="input-label">Token / Booking Amount (₹)</label>
              <input type="number" className="input-field" placeholder="e.g. 100000" {...register('token_amount')} />
            </div>
          </div>
          <div className="mt-4">
            <label className="input-label">Notes / Special Terms</label>
            <textarea className="input-field resize-none" rows={3}
              placeholder="Any special terms, discounts, or notes for this client..."
              {...register('notes')} />
          </div>
        </div>

        {/* PREVIEW */}
        {(watchedClientName || watchedProject || watchedAmount) && (
          <div className="card p-4 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10">
            <p className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-2">
              Preview — What client will see
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{watchedClientName || '[Client Name]'}</strong> will receive a link to view
              their quote for <strong>{watchedProject || '[Project]'}</strong>
              {watchedAmount && ` valued at `}
              {watchedAmount && <strong>{formatINR(watchedAmount)}</strong>}
              {' '}and complete their onboarding form.
            </p>
          </div>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {isLoading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Link...</>
          ) : (
            <><Link2 className="w-5 h-5" /> Generate Magic Link</>
          )}
        </button>
      </form>
    </div>
  )
}

export default CreateQuote
