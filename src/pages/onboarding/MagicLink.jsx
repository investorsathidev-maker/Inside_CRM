// ============================================================
// pages/onboarding/MagicLink.jsx
//
// This is the page clients land on when they open the magic link.
// URL looks like: /onboard?token=abc123
//    OR:          /onboarding/abc123
//
// This page:
// 1. Reads the token from the URL
// 2. Verifies it in the database
// 3. Shows the quote details to the client
// 4. Redirects them to the full onboarding form
// ============================================================

import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Building2, CheckCircle, AlertCircle, ArrowRight,
  Clock, MapPin, IndianRupee, FileText
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatINR, formatDate } from '../../lib/utils'

function MagicLink() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading | valid | invalid | expired | used
  const [tokenData, setTokenData] = useState(null)
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    verifyToken()
  }, [token])

  async function verifyToken() {
    try {
      const { data, error } = await supabase
        .from('onboarding_tokens')
        .select('*, quote:quotes(*)')
        .eq('token', token)
        .single()

      if (error || !data) {
        setStatus('invalid')
        return
      }

      if (data.used) {
        setStatus('used')
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        setStatus('expired')
        return
      }

      setTokenData(data)
      setQuote(data.quote)
      setStatus('valid')

    } catch (err) {
      console.error('Token verification error:', err)
      setStatus('invalid')
    }
  }

  function handleProceed() {
    navigate(`/onboarding/${token}`)
  }

  // ---- LOADING STATE ----
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying your link...</p>
        </div>
      </div>
    )
  }

  // ---- ERROR STATES ----
  if (status !== 'valid') {
    const errorMessages = {
      invalid: {
        title: 'Invalid Link',
        message: 'This onboarding link is not valid. Please contact your Investor Sathi representative.',
        icon: AlertCircle,
        color: 'text-red-500',
      },
      expired: {
        title: 'Link Expired',
        message: 'This onboarding link has expired (valid for 7 days). Please ask your representative to send a new link.',
        icon: Clock,
        color: 'text-orange-500',
      },
      used: {
        title: 'Already Completed',
        message: 'This onboarding link has already been used. Your information has been submitted. Please contact your representative for any changes.',
        icon: CheckCircle,
        color: 'text-green-500',
      },
    }

    const info = errorMessages[status] || errorMessages.invalid

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-6">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <info.icon className={`w-16 h-16 ${info.color} mx-auto mb-4`} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{info.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{info.message}</p>
          <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-sm text-primary-700 dark:text-primary-300">
            📞 Need help? Call us or WhatsApp:<br />
            <strong>+91 98765 43210</strong>
          </div>
        </div>
      </div>
    )
  }

  // ---- VALID TOKEN — SHOW QUOTE ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30 dark:from-gray-950 dark:to-gray-900">

      {/* TOP BRAND BAR */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">Investor Sathi</p>
            <p className="text-gray-400 text-xs">Secure Client Onboarding</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 py-8 space-y-5 animate-fade-in">

        {/* WELCOME CARD */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl p-6 text-white">
          <p className="text-primary-200 text-sm mb-1">Welcome,</p>
          <h1 className="text-2xl font-bold">{quote?.client_name || 'Valued Client'}</h1>
          <p className="text-primary-200 text-sm mt-2 leading-relaxed">
            We're excited to have you onboard! Please review your quote details below and
            complete the onboarding process. It only takes 5 minutes.
          </p>
        </div>

        {/* QUOTE DETAILS CARD */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" />
              Your Property Quote
            </h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Project info */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Project</p>
                <p className="font-semibold text-gray-900 dark:text-white">{quote?.project_name}</p>
                {quote?.plot_number && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Plot Number: {quote.plot_number}</p>
                )}
                {quote?.plot_size && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Size: {quote.plot_size}</p>
                )}
              </div>
            </div>

            <div className="divider" />

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" /> Total Amount
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatINR(quote?.total_amount)}
                </p>
              </div>
              {quote?.token_amount && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Booking Amount</p>
                  <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {formatINR(quote.token_amount)}
                  </p>
                </div>
              )}
            </div>

            {quote?.notes && (
              <>
                <div className="divider" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Special Notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    {quote.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* WHAT TO EXPECT */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">What happens next?</h3>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Fill Personal Details',  desc: 'Your name, phone, occupation, city' },
              { step: '2', title: 'Investment Information', desc: 'Investment experience and preferences' },
              { step: '3', title: 'Property Confirmation', desc: 'Confirm plot and project details' },
              { step: '4', title: 'Upload KYC Documents',  desc: 'PAN card and Aadhaar card' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LINK VALIDITY WARNING */}
        <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>
            This link expires on <strong>{formatDate(tokenData?.expires_at)}</strong>. 
            Complete the form before then.
          </span>
        </div>

        {/* CTA BUTTON */}
        <button
          onClick={handleProceed}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl
            flex items-center justify-center gap-2 text-base transition-colors duration-200 shadow-lg shadow-primary-900/30"
        >
          Start Onboarding
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          🔒 Your information is encrypted and secure. We never share your data.
        </p>
      </main>
    </div>
  )
}

export default MagicLink
