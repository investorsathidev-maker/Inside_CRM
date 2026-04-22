// ============================================================
// lib/supabase.js — Supabase Client Configuration
// This creates a single connection to your Supabase database
// Import this file wherever you need to talk to the database
// ============================================================

import { createClient } from '@supabase/supabase-js'

// These values come from your .env file
// VITE_ prefix is required by Vite to expose env variables to browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables! ' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in your .env file'
  )
}

// Create and export the Supabase client
// This is like a "phone" that lets us call our database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Store the auth session in localStorage so user stays logged in on refresh
    persistSession: true,
    autoRefreshToken: true,
  }
})

// ============================================================
// HELPER FUNCTIONS for common database operations
// ============================================================

// Upload a file to Supabase Storage
// bucket: 'documents', path: 'pan-cards/clientid.jpg'
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,  // Overwrite if file already exists
    })
  
  if (error) throw error
  
  // Get the public URL of the uploaded file
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return publicUrl
}

// Get all clients (with profile info of who they're assigned to)
export async function getClients(userId, isAdmin) {
  let query = supabase
    .from('clients')
    .select(`
      *,
      assigned_profile:profiles!clients_assigned_to_fkey(full_name, id),
      created_profile:profiles!clients_created_by_fkey(full_name, id)
    `)
    .order('created_at', { ascending: false })
  
  // If not admin, only show their own clients
  if (!isAdmin) {
    query = query.eq('assigned_to', userId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

// Get a single client with all their payment milestones and logs
export async function getClient(clientId) {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      assigned_profile:profiles!clients_assigned_to_fkey(full_name, phone),
      payment_milestones(*),
      communication_logs(*)
    `)
    .eq('id', clientId)
    .single()  // Expect exactly one result
  
  if (error) throw error
  return data
}

// Get all quotes (for salesperson or all for admin)
export async function getQuotes(userId, isAdmin) {
  let query = supabase
    .from('quotes')
    .select(`*, creator:profiles!quotes_created_by_fkey(full_name)`)
    .order('created_at', { ascending: false })
  
  if (!isAdmin) {
    query = query.eq('created_by', userId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

// Verify a magic link token and get the associated quote
export async function verifyToken(token) {
  const { data, error } = await supabase
    .from('onboarding_tokens')
    .select(`*, quote:quotes(*)`)
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())  // Not expired
    .single()
  
  if (error) return null
  return data
}
