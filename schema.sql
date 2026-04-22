-- ============================================================
-- INVESTOR SATHI CRM — SUPABASE DATABASE SCHEMA
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLE 1: profiles
-- Extends Supabase's built-in auth.users table
-- Stores role (admin/salesperson) and extra info
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT 'User',
  role        TEXT NOT NULL DEFAULT 'salesperson' 
              CHECK (role IN ('admin', 'salesperson')),
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: clients
-- Stores all client information collected during onboarding
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Personal Details
  full_name           TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT,
  age_range           TEXT,           -- e.g. "25-35", "35-45"
  occupation          TEXT,
  city                TEXT,
  investment_status   TEXT,           -- e.g. "First time", "Experienced"
  
  -- Property Details
  project_name        TEXT,
  plot_number         TEXT,
  
  -- Plot Owner Details (who owns the plot being sold)
  plot_owner_name     TEXT,
  plot_owner_phone    TEXT,
  plot_owner_email    TEXT,
  plot_owner_gender   TEXT,
  
  -- System Fields
  stage               TEXT DEFAULT 'Lead' 
                      CHECK (stage IN ('Lead', 'Onboarded', 'Payment', 'Completed')),
  assigned_to         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  quote_id            UUID,           -- Will reference quotes table
  
  -- Document URLs (stored in Supabase Storage)
  pan_card_url        TEXT,
  aadhaar_card_url    TEXT,
  
  -- Timestamps
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: quotes
-- Created by salesperson before sending magic link to client
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Client Info (before they onboard)
  client_name     TEXT NOT NULL,
  client_email    TEXT,
  client_phone    TEXT NOT NULL,
  
  -- Property/Deal Info
  project_name    TEXT NOT NULL,
  plot_number     TEXT,
  plot_size       TEXT,              -- e.g. "200 sq yards"
  total_amount    DECIMAL(12, 2) NOT NULL,
  token_amount    DECIMAL(12, 2),   -- Booking amount
  notes           TEXT,
  
  -- System Fields
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'pending' 
                  CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: onboarding_tokens
-- The "magic links" - each quote gets a unique token
-- Client uses this token to access their pre-filled form
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  quote_id    UUID REFERENCES quotes(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  used        BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: payment_milestones
-- Payment schedule for each client
-- Each milestone = one installment they need to pay
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_milestones (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  name                TEXT NOT NULL,      -- e.g. "Token Amount", "First Installment"
  amount              DECIMAL(12, 2) NOT NULL,
  due_date            DATE NOT NULL,
  
  status              TEXT DEFAULT 'Pending' 
                      CHECK (status IN ('Pending', 'Paid', 'Overdue')),
  paid_at             TIMESTAMPTZ,
  payment_proof_url   TEXT,               -- Screenshot of payment
  payment_method      TEXT,               -- e.g. "Bank Transfer", "Cheque"
  transaction_id      TEXT,
  notes               TEXT,
  
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: communication_logs
-- Track all emails, WhatsApp messages, calls, notes
-- ============================================================
CREATE TABLE IF NOT EXISTS communication_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  type        TEXT NOT NULL 
              CHECK (type IN ('email', 'whatsapp', 'call', 'note', 'sms')),
  subject     TEXT,
  message     TEXT NOT NULL,
  status      TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FOREIGN KEY: Add quote_id constraint to clients
-- (Done after both tables exist)
-- ============================================================
ALTER TABLE clients 
  ADD CONSTRAINT clients_quote_id_fkey 
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'salesperson')
  );
  RETURN NEW;
END;
$$;

-- Trigger: fires when new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update "updated_at" timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUTO-OVERDUE: Function to mark payments as Overdue
-- Run this function daily using Supabase Cron or n8n
-- ============================================================
CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE payment_milestones
  SET status = 'Overdue'
  WHERE 
    status = 'Pending' 
    AND due_date < CURRENT_DATE;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- This controls WHO can see WHAT data
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES POLICIES ----
-- Everyone can read profiles (for showing salesperson names)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ---- CLIENTS POLICIES ----
-- Admins can do everything
CREATE POLICY "clients_admin_all" ON clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Salespersons can only see their own clients
CREATE POLICY "clients_salesperson_select" ON clients
  FOR SELECT USING (
    assigned_to = auth.uid() 
    OR created_by = auth.uid()
  );

-- Salespersons can create clients
CREATE POLICY "clients_salesperson_insert" ON clients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Salespersons can update their own clients
CREATE POLICY "clients_salesperson_update" ON clients
  FOR UPDATE USING (
    assigned_to = auth.uid() 
    OR created_by = auth.uid()
  );

-- ---- QUOTES POLICIES ----
CREATE POLICY "quotes_admin_all" ON quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "quotes_salesperson_own" ON quotes
  FOR ALL USING (created_by = auth.uid());

-- ---- ONBOARDING TOKENS POLICIES ----
-- Public read (clients need to verify tokens without logging in)
CREATE POLICY "tokens_public_select" ON onboarding_tokens
  FOR SELECT USING (true);

-- Only auth users can create tokens
CREATE POLICY "tokens_auth_insert" ON onboarding_tokens
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Anyone can update (mark as used) — needed for client form submission
CREATE POLICY "tokens_public_update" ON onboarding_tokens
  FOR UPDATE USING (true);

-- ---- PAYMENT MILESTONES POLICIES ----
CREATE POLICY "payments_admin_all" ON payment_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "payments_salesperson_own" ON payment_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE id = payment_milestones.client_id 
      AND (assigned_to = auth.uid() OR created_by = auth.uid())
    )
  );

-- ---- COMMUNICATION LOGS POLICIES ----
CREATE POLICY "logs_auth_all" ON communication_logs
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- STORAGE: Create documents bucket (run in Storage UI instead)
-- But here are the storage policies if needed via SQL
-- ============================================================
-- Note: Create a bucket named "documents" in the Supabase UI Storage section
-- Set it as PUBLIC bucket

-- ============================================================
-- SAMPLE DATA: Create a test admin user profile
-- (After you create your first user via Supabase Auth)
-- Replace 'your-user-id-here' with actual UUID from auth.users table
-- ============================================================
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id-here';

-- ============================================================
-- VERIFICATION: Run this to check all tables were created
-- ============================================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;