// ============================================================
// lib/utils.js — Utility / Helper Functions
// Small reusable functions used throughout the app
// ============================================================

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isAfter, isBefore, parseISO } from 'date-fns'

// ---- CLASS NAME HELPER ----
// Combines class names and resolves Tailwind conflicts
// Usage: cn('text-red-500', isActive && 'font-bold', 'text-blue-500')
// → 'font-bold text-blue-500' (text-blue-500 wins over text-red-500)
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// ---- DATE FORMATTING ----
// Format a date string to readable format
// Usage: formatDate('2024-01-15') → 'Jan 15, 2024'
export function formatDate(dateString) {
  if (!dateString) return '—'
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
    return format(date, 'MMM dd, yyyy')
  } catch {
    return dateString
  }
}

// Format date with time
export function formatDateTime(dateString) {
  if (!dateString) return '—'
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
    return format(date, 'MMM dd, yyyy • h:mm a')
  } catch {
    return dateString
  }
}

// ---- CURRENCY FORMATTING ----
// Format number to Indian Rupee format
// Usage: formatINR(1500000) → '₹15,00,000'
export function formatINR(amount) {
  if (!amount && amount !== 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ---- PAYMENT STATUS ----
// Determine if a payment milestone is overdue based on due date
export function getPaymentStatus(milestone) {
  if (milestone.status === 'Paid') return 'Paid'
  const today = new Date()
  const dueDate = parseISO(milestone.due_date)
  if (isBefore(dueDate, today)) return 'Overdue'
  return 'Pending'
}

// ---- STAGE COLORS ----
// Get CSS classes for each client stage
export function getStageColor(stage) {
  const colors = {
    'Lead':      'badge-lead',
    'Onboarded': 'badge-onboarded',
    'Payment':   'badge-payment',
    'Completed': 'badge-completed',
  }
  return colors[stage] || 'badge-pending'
}

// Get CSS classes for payment status
export function getPaymentColor(status) {
  const colors = {
    'Pending': 'badge-pending',
    'Paid':    'badge-paid',
    'Overdue': 'badge-overdue',
  }
  return colors[status] || 'badge-pending'
}

// ---- TRUNCATE TEXT ----
// Shorten long text with ellipsis
// Usage: truncate('Long text here', 20) → 'Long text here...'
export function truncate(text, maxLength = 30) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// ---- GENERATE INITIALS ----
// Get initials from full name for avatar
// Usage: getInitials('Priya Mehta') → 'PM'
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ---- PHONE FORMATTING ----
// Format Indian phone number
export function formatPhone(phone) {
  if (!phone) return '—'
  // Remove non-digits
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return phone
}

// ---- COPY TO CLIPBOARD ----
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// ---- DEBOUNCE ----
// Delay function execution (useful for search inputs)
export function debounce(func, wait = 300) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
