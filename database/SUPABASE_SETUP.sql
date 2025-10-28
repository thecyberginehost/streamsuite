-- =====================================================
-- StreamSuite MVP - Supabase Database Setup
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This will create all necessary tables, policies, and functions
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Extends auth.users with additional user data
-- Every user gets a profile automatically on signup

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 100, -- MVP: Start with 100 free credits
  total_workflows_generated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =====================================================
-- WORKFLOWS TABLE
-- =====================================================
-- Stores all generated workflows with metadata

CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT DEFAULT 'n8n' CHECK (platform IN ('n8n', 'make', 'zapier')),
  workflow_json JSONB NOT NULL,
  prompt TEXT, -- Original user prompt that generated this workflow
  template_used TEXT, -- Template ID if template was used
  credits_used INTEGER DEFAULT 1,
  tokens_used INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows
CREATE POLICY "Users can view their own workflows"
  ON public.workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflows"
  ON public.workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
  ON public.workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
  ON public.workflows FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON public.workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_platform ON public.workflows(platform);
CREATE INDEX IF NOT EXISTS idx_workflows_is_favorite ON public.workflows(is_favorite) WHERE is_favorite = true;

-- =====================================================
-- CREDIT_TRANSACTIONS TABLE (Optional - for tracking)
-- =====================================================
-- Tracks all credit usage for analytics and debugging

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- Negative for deductions, positive for additions
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('generation', 'conversion', 'debug', 'purchase', 'refund', 'bonus')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Create profile automatically on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Update updated_at on profiles and workflows
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_workflows ON public.workflows;
CREATE TRIGGER set_updated_at_workflows
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function: Deduct credits from user profile
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_workflow_id UUID DEFAULT NULL,
  p_transaction_type TEXT DEFAULT 'generation'
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update user credits
  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, workflow_id, amount, transaction_type)
  VALUES (p_user_id, p_workflow_id, -p_amount, p_transaction_type);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add credits to user profile
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update user credits
  UPDATE public.profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, p_amount, p_transaction_type, p_description);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's credit balance
CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT credits INTO v_credits
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN COALESCE(v_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEWS (Optional - for analytics)
-- =====================================================

-- View: User stats
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  p.id,
  p.email,
  p.credits,
  p.total_workflows_generated,
  COUNT(DISTINCT w.id) as workflows_saved,
  COUNT(DISTINCT ct.id) as total_transactions,
  SUM(CASE WHEN ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END) as total_credits_spent,
  p.created_at as member_since
FROM public.profiles p
LEFT JOIN public.workflows w ON w.user_id = p.id
LEFT JOIN public.credit_transactions ct ON ct.user_id = p.id
GROUP BY p.id, p.email, p.credits, p.total_workflows_generated, p.created_at;

-- =====================================================
-- SAMPLE DATA (for testing - remove in production)
-- =====================================================

-- Uncomment to add sample data for testing
/*
-- Insert test user (you'll need to create this user via Supabase Auth first)
-- Then insert sample workflows:

INSERT INTO public.workflows (user_id, name, description, platform, workflow_json, prompt, credits_used)
VALUES (
  'YOUR_TEST_USER_ID_HERE',
  'Sample Email Workflow',
  'Sends an email when webhook is triggered',
  'n8n',
  '{"name":"Sample Workflow","nodes":[],"connections":{}}'::jsonb,
  'Send an email when a webhook is triggered',
  1
);
*/

-- =====================================================
-- CLEANUP (if you need to reset)
-- =====================================================

-- DANGER: Uncomment to drop all tables and start fresh
/*
DROP VIEW IF EXISTS public.user_stats;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_workflows ON public.workflows;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.deduct_credits(UUID, INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_credits(UUID);
DROP TABLE IF EXISTS public.credit_transactions;
DROP TABLE IF EXISTS public.workflows;
DROP TABLE IF EXISTS public.profiles;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify everything is set up correctly

-- 1. Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'workflows', 'credit_transactions');

-- 2. Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'workflows', 'credit_transactions');

-- 3. Check if indexes exist
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'workflows', 'credit_transactions');

-- 4. Check if triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- =====================================================
-- POST-SETUP CHECKLIST
-- =====================================================

-- [ ] All tables created successfully
-- [ ] RLS policies enabled on all tables
-- [ ] Indexes created for performance
-- [ ] Triggers set up for auto-profile creation
-- [ ] Functions created for credit management
-- [ ] Test user signup creates profile automatically
-- [ ] Test workflow creation saves to database
-- [ ] Test credit deduction works correctly

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Your StreamSuite database is ready to use.
-- Copy the Supabase URL and anon key to your .env file.
-- =====================================================
