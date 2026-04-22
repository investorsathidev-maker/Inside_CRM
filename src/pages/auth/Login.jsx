// ============================================================
// pages/auth/Login.jsx — Login Page
//
// Public page - no login required to see this.
// Uses React Hook Form for form management.
// Uses Zod for input validation.
// ============================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// ---- VALIDATION SCHEMA ----
// Zod defines what valid inputs look like
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
})

function Login() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  // React Hook Form setup
  const {
    register,       // Connects inputs to the form
    handleSubmit,   // Handles form submission
    formState: { errors }  // Contains validation errors
  } = useForm({
    resolver: zodResolver(loginSchema),  // Use Zod for validation
  })

  // ---- FORM SUBMISSION ----
  async function onSubmit(data) {
    setIsLoading(true)
    setLoginError('')
    
    try {
      await signIn(data.email, data.password)
      navigate('/dashboard')
    } catch (error) {
      // Show user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        setLoginError('Incorrect email or password. Please try again.')
      } else if (error.message.includes('Email not confirmed')) {
        setLoginError('Please verify your email address first.')
      } else {
        setLoginError('Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-primary-950 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* ---- LOGIN CARD ---- */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800">
          
          {/* ---- LOGO ---- */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-900/50">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Investor Sathi
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              CRM & Client Management Portal
            </p>
          </div>

          {/* ---- ERROR MESSAGE ---- */}
          {loginError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-400 text-sm">{loginError}</p>
            </div>
          )}

          {/* ---- LOGIN FORM ---- */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Email field */}
            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                placeholder="you@investorsathi.com"
                className="input-field"
                // register connects this input to React Hook Form
                {...register('email')}
              />
              {/* Show validation error if any */}
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="input-field pr-10"
                  {...register('password')}
                />
                {/* Show/hide password button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Login to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* ---- FOOTER NOTE ---- */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
            Contact your administrator if you need access.
          </p>
        </div>

        {/* Version info */}
        <p className="text-center text-gray-500 text-xs mt-4">
          Investor Sathi CRM v1.0 • Internal Tool
        </p>
      </div>
    </div>
  )
}

export default Login
