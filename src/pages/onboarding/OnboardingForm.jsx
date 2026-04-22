// ============================================================
// pages/onboarding/OnboardingForm.jsx
//
// Multi-step form that clients fill out after viewing quote.
// URL: /onboarding/:token
//
// 4 Steps:
// Step 1 — Personal Details
// Step 2 — Investment Info
// Step 3 — Property / Plot Details
// Step 4 — Document Upload (PAN + Aadhaar)
// ============================================================

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2, CheckCircle, ArrowRight, ArrowLeft,
  Upload, User, Briefcase, Home, FileText, AlertCircle, X
} from 'lucide-react'
import { supabase, uploadFile, verifyToken } from '../../lib/supabase'
import { cn, formatINR } from '../../lib/utils'

// ============================================================
// VALIDATION SCHEMAS (one per step)
// ============================================================

const step1Schema = z.object({
  full_name:         z.string().min(2, 'Full name is required'),
  phone:             z.string().min(10, 'Enter valid 10-digit number'),
  email:             z.string().email('Invalid email').optional().or(z.literal('')),
  age_range:         z.string().min(1, 'Please select age range'),
  occupation:        z.string().min(2, 'Occupation is required'),
  city:              z.string().min(2, 'City is required'),
})

const step2Schema = z.object({
  investment_status: z.string().min(1, 'Please select investment status'),
})

const step3Schema = z.object({
  plot_owner_name:   z.string().min(2, 'Plot owner name is required'),
  plot_owner_phone:  z.string().min(10, 'Enter valid phone number'),
  plot_owner_email:  z.string().email('Invalid email').optional().or(z.literal('')),
  plot_owner_gender: z.string().min(1, 'Please select gender'),
})

// ============================================================
// STEP INDICATOR COMPONENT
// ============================================================
function StepIndicator({ currentStep, totalSteps, steps }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const stepNumber   = index + 1
        const isCompleted  = stepNumber < currentStep
        const isCurrent    = stepNumber === currentStep
        const isUpcoming   = stepNumber > currentStep

        return (
          <div key={step.id} className="flex items-center flex-1">
            {/* Circle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                isCompleted ? 'bg-primary-600 text-white' : '',
                isCurrent   ? 'bg-primary-600 text-white ring-4 ring-primary-200 dark:ring-primary-900' : '',
                isUpcoming  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600' : '',
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <p className={cn(
                'text-xs mt-1 font-medium hidden sm:block',
                isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
              )}>
                {step.label}
              </p>
            </div>

            {/* Connector line */}
            {index < totalSteps - 1 && (
              <div className={cn(
                'h-0.5 flex-1 mx-2 transition-all duration-500',
                stepNumber < currentStep ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// MAIN ONBOARDING FORM
// ============================================================
function OnboardingForm() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(1)
  const [tokenData, setTokenData] = useState(null)
  const [quote, setQuote] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | invalid | success | submitting
  const [formData, setFormData] = useState({})

  // Document files (stored separately from form data)
  const [panFile, setPanFile] = useState(null)
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [panPreview, setPanPreview] = useState('')
  const [aadhaarPreview, setAadhaarPreview] = useState('')
  const [docError, setDocError] = useState('')

  const STEPS = [
    { id: 1, label: 'Personal',  icon: User      },
    { id: 2, label: 'Investment', icon: Briefcase },
    { id: 3, label: 'Property',  icon: Home       },
    { id: 4, label: 'Documents', icon: FileText   },
  ]

  // Separate form instances for each step
  const form1 = useForm({ resolver: zodResolver(step1Schema) })
  const form2 = useForm({ resolver: zodResolver(step2Schema) })
  const form3 = useForm({ resolver: zodResolver(step3Schema) })

  useEffect(() => {
    validateToken()
  }, [token])

  async function validateToken() {
    const data = await verifyToken(token)
    if (!data) {
      setStatus('invalid')
      return
    }
    setTokenData(data)
    setQuote(data.quote)

    // Pre-fill form1 with known info from quote
    if (data.quote) {
      form1.setValue('full_name', data.quote.client_name || '')
      form1.setValue('phone', data.quote.client_phone || '')
      form1.setValue('email', data.quote.client_email || '')
    }

    setStatus('ready')
  }

  // ---- HANDLE STEP 1 ----
  function onStep1Submit(data) {
    setFormData(prev => ({ ...prev, ...data }))
    setCurrentStep(2)
  }

  // ---- HANDLE STEP 2 ----
  function onStep2Submit(data) {
    setFormData(prev => ({ ...prev, ...data }))
    setCurrentStep(3)
  }

  // ---- HANDLE STEP 3 ----
  function onStep3Submit(data) {
    setFormData(prev => ({ ...prev, ...data }))
    setCurrentStep(4)
  }

  // ---- HANDLE FILE INPUT ----
  function handleFileChange(type, file) {
    if (!file) return

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)|application\/pdf/)) {
      setDocError('Only images (JPG, PNG) and PDFs are accepted.')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setDocError('File too large. Maximum size is 5MB.')
      return
    }

    setDocError('')

    if (type === 'pan') {
      setPanFile(file)
      if (file.type.startsWith('image/')) {
        setPanPreview(URL.createObjectURL(file))
      } else {
        setPanPreview('pdf')
      }
    } else {
      setAadhaarFile(file)
      if (file.type.startsWith('image/')) {
        setAadhaarPreview(URL.createObjectURL(file))
      } else {
        setAadhaarPreview('pdf')
      }
    }
  }

  // ---- FINAL SUBMISSION ----
  async function handleFinalSubmit() {
    if (!panFile || !aadhaarFile) {
      setDocError('Please upload both PAN Card and Aadhaar Card.')
      return
    }

    setStatus('submitting')

    try {
      // Step A: Upload PAN card
      const panPath = `pan-cards/${token}-pan.${panFile.name.split('.').pop()}`
      const panUrl = await uploadFile('documents', panPath, panFile)

      // Step B: Upload Aadhaar card
      const aadhaarPath = `aadhaar-cards/${token}-aadhaar.${aadhaarFile.name.split('.').pop()}`
      const aadhaarUrl = await uploadFile('documents', aadhaarPath, aadhaarFile)

      // Step C: Insert client record into database
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          // Personal details (from Step 1)
          full_name:         formData.full_name,
          phone:             formData.phone,
          email:             formData.email || null,
          age_range:         formData.age_range,
          occupation:        formData.occupation,
          city:              formData.city,

          // Investment info (from Step 2)
          investment_status: formData.investment_status,

          // Property details (from quote + Step 3)
          project_name:      quote?.project_name || null,
          plot_number:       quote?.plot_number || null,

          // Plot owner details (from Step 3)
          plot_owner_name:   formData.plot_owner_name,
          plot_owner_phone:  formData.plot_owner_phone,
          plot_owner_email:  formData.plot_owner_email || null,
          plot_owner_gender: formData.plot_owner_gender,

          // Documents
          pan_card_url:      panUrl,
          aadhaar_card_url:  aadhaarUrl,

          // System
          stage:       'Onboarded',
          quote_id:    quote?.id || null,
          assigned_to: quote?.created_by || null,
          created_by:  quote?.created_by || null,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Step D: Mark token as used
      await supabase
        .from('onboarding_tokens')
        .update({ used: true, client_id: clientData.id })
        .eq('token', token)

      // Step E: Update quote status
      if (quote?.id) {
        await supabase
          .from('quotes')
          .update({ status: 'accepted' })
          .eq('id', quote.id)
      }

      // Step F: Log the onboarding event
      await supabase.from('communication_logs').insert({
        client_id: clientData.id,
        type: 'note',
        subject: 'Client Onboarded',
        message: `${formData.full_name} completed onboarding form for ${quote?.project_name || 'property'}.`,
        created_by: quote?.created_by || null,
      })

      setStatus('success')

    } catch (err) {
      console.error('Submission error:', err)
      setDocError('Submission failed: ' + err.message)
      setStatus('ready')
    }
  }

  // ---- RENDER: LOADING ----
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Preparing your form...</p>
        </div>
      </div>
    )
  }

  // ---- RENDER: INVALID TOKEN ----
  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid Link</h1>
          <p className="text-gray-500">This link is no longer valid. Please contact your representative.</p>
        </div>
      </div>
    )
  }

  // ---- RENDER: SUCCESS ----
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/30">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Onboarding Complete! 🎉
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Thank you, <strong>{formData.full_name}</strong>! Your onboarding is complete.
              Our team will contact you shortly.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 text-left space-y-2 border border-gray-200 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Submitted Details:</p>
            {[
              ['Project',   quote?.project_name],
              ['Plot',      quote?.plot_number],
              ['Amount',    formatINR(quote?.total_amount)],
              ['Your Name', formData.full_name],
              ['Phone',     formData.phone],
              ['City',      formData.city],
            ].map(([label, value]) => value && (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400 dark:text-gray-500">{label}</span>
                <span className="font-medium text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 text-sm text-primary-700 dark:text-primary-300">
            📞 Our team will call you within <strong>24 hours</strong> to confirm everything.
          </div>
        </div>
      </div>
    )
  }

  // ---- RENDER: MAIN FORM ----
  const getActiveForm = () => {
    if (currentStep === 1) return form1
    if (currentStep === 2) return form2
    if (currentStep === 3) return form3
    return null
  }

  const activeForm = getActiveForm()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Brand Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-3 px-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Investor Sathi</p>
            <p className="text-gray-400 text-xs">
              Step {currentStep} of 4 — {STEPS[currentStep - 1].label}
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 sm:p-6 py-6">
        {/* Quote summary strip */}
        {quote && (
          <div className="bg-primary-700 text-white rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary-300">Your Quote</p>
              <p className="font-semibold text-sm truncate">{quote.project_name}</p>
            </div>
            <p className="text-primary-200 font-bold text-sm flex-shrink-0">{formatINR(quote.total_amount)}</p>
          </div>
        )}

        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={4} steps={STEPS} />

        {/* ======================== STEP 1: PERSONAL DETAILS ======================== */}
        {currentStep === 1 && (
          <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Personal Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Full Name *</label>
                  <input className="input-field" placeholder="As per PAN card" {...form1.register('full_name')} />
                  {form1.formState.errors.full_name && (
                    <p className="text-red-500 text-xs mt-1">{form1.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Phone *</label>
                    <input className="input-field" placeholder="10-digit number" {...form1.register('phone')} />
                    {form1.formState.errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{form1.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="input-label">Age Range *</label>
                    <select className="input-field" {...form1.register('age_range')}>
                      <option value="">Select</option>
                      <option value="18-25">18 – 25</option>
                      <option value="25-35">25 – 35</option>
                      <option value="35-45">35 – 45</option>
                      <option value="45-55">45 – 55</option>
                      <option value="55+">55+</option>
                    </select>
                    {form1.formState.errors.age_range && (
                      <p className="text-red-500 text-xs mt-1">{form1.formState.errors.age_range.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="input-label">Email Address</label>
                  <input type="email" className="input-field" placeholder="optional" {...form1.register('email')} />
                  {form1.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{form1.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Occupation *</label>
                    <select className="input-field" {...form1.register('occupation')}>
                      <option value="">Select</option>
                      <option value="Salaried">Salaried</option>
                      <option value="Business Owner">Business Owner</option>
                      <option value="Self Employed">Self Employed</option>
                      <option value="Retired">Retired</option>
                      <option value="Homemaker">Homemaker</option>
                      <option value="Student">Student</option>
                      <option value="Other">Other</option>
                    </select>
                    {form1.formState.errors.occupation && (
                      <p className="text-red-500 text-xs mt-1">{form1.formState.errors.occupation.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="input-label">City *</label>
                    <input className="input-field" placeholder="Your city" {...form1.register('city')} />
                    {form1.formState.errors.city && (
                      <p className="text-red-500 text-xs mt-1">{form1.formState.errors.city.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ======================== STEP 2: INVESTMENT INFO ======================== */}
        {currentStep === 2 && (
          <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Investment Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Investment Experience *</label>
                  <div className="grid grid-cols-1 gap-2 mt-1">
                    {[
                      { value: 'First Time Investor', label: '🌱 First Time Investor', desc: 'This is my first property investment' },
                      { value: 'Experienced',         label: '🏗️ Experienced',          desc: 'I have invested in property before' },
                      { value: 'Portfolio Builder',   label: '📈 Portfolio Builder',    desc: 'I own multiple properties' },
                    ].map(option => {
                      const selected = form2.watch('investment_status') === option.value
                      return (
                        <label
                          key={option.value}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                            selected
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          )}
                        >
                          <input
                            type="radio"
                            value={option.value}
                            {...form2.register('investment_status')}
                            className="accent-primary-600"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                  {form2.formState.errors.investment_status && (
                    <p className="text-red-500 text-xs mt-1">{form2.formState.errors.investment_status.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setCurrentStep(1)} className="btn-secondary flex-1 justify-center">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button type="submit" className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ======================== STEP 3: PLOT OWNER DETAILS ======================== */}
        {currentStep === 3 && (
          <form onSubmit={form3.handleSubmit(onStep3Submit)} className="space-y-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Plot Owner Details</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Details of the person selling the plot to you</p>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Plot Owner Full Name *</label>
                  <input className="input-field" placeholder="Legal name" {...form3.register('plot_owner_name')} />
                  {form3.formState.errors.plot_owner_name && (
                    <p className="text-red-500 text-xs mt-1">{form3.formState.errors.plot_owner_name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Owner Phone *</label>
                    <input className="input-field" placeholder="10-digit" {...form3.register('plot_owner_phone')} />
                    {form3.formState.errors.plot_owner_phone && (
                      <p className="text-red-500 text-xs mt-1">{form3.formState.errors.plot_owner_phone.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="input-label">Owner Gender *</label>
                    <select className="input-field" {...form3.register('plot_owner_gender')}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {form3.formState.errors.plot_owner_gender && (
                      <p className="text-red-500 text-xs mt-1">{form3.formState.errors.plot_owner_gender.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="input-label">Owner Email</label>
                  <input type="email" className="input-field" placeholder="Optional" {...form3.register('plot_owner_email')} />
                </div>

                {/* Confirm property details from quote */}
                {quote && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Confirming Property</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{quote.project_name}</p>
                    {quote.plot_number && <p className="text-xs text-gray-500 dark:text-gray-400">Plot {quote.plot_number}</p>}
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Details match your quote</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setCurrentStep(2)} className="btn-secondary flex-1 justify-center">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button type="submit" className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ======================== STEP 4: DOCUMENT UPLOAD ======================== */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Upload KYC Documents</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
                Please upload clear photos or scans. Accepted: JPG, PNG, PDF (max 5MB each)
              </p>

              {docError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 dark:text-red-400 text-sm">{docError}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* PAN Card upload */}
                {[
                  {
                    type: 'pan',
                    label: 'PAN Card *',
                    hint: 'Front side of PAN card',
                    file: panFile,
                    preview: panPreview,
                    setter: (f) => handleFileChange('pan', f),
                    clear: () => { setPanFile(null); setPanPreview('') }
                  },
                  {
                    type: 'aadhaar',
                    label: 'Aadhaar Card *',
                    hint: 'Both sides preferred',
                    file: aadhaarFile,
                    preview: aadhaarPreview,
                    setter: (f) => handleFileChange('aadhaar', f),
                    clear: () => { setAadhaarFile(null); setAadhaarPreview('') }
                  }
                ].map(({ type, label, hint, file, preview, setter, clear }) => (
                  <div key={type}>
                    <label className="input-label">{label}</label>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{hint}</p>

                    {!file ? (
                      <label className="
                        block border-2 border-dashed border-gray-300 dark:border-gray-700
                        rounded-xl p-6 text-center cursor-pointer
                        hover:border-primary-400 dark:hover:border-primary-600
                        transition-colors group
                      ">
                        <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2 group-hover:text-primary-400 transition-colors" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Click to upload <span className="text-primary-600 dark:text-primary-400 font-medium">{label.replace(' *', '')}</span>
                        </p>
                        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">JPG, PNG, or PDF • Max 5MB</p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && setter(e.target.files[0])}
                        />
                      </label>
                    ) : (
                      <div className="border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center gap-3">
                        {preview && preview !== 'pdf' ? (
                          <img src={preview} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button onClick={clear} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy note */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              🔒 <strong>Privacy:</strong> Your documents are encrypted and stored securely.
              They are only accessible to your dedicated Investor Sathi representative.
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setCurrentStep(3)} className="btn-secondary flex-1 justify-center">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={status === 'submitting'}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {status === 'submitting' ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Submit Onboarding</>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default OnboardingForm
