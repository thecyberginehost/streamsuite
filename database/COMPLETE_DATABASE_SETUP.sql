-- =====================================================
-- COMPLETE DATABASE SETUP FOR STREAMSUITE
-- =====================================================
-- Run this entire script in Supabase SQL Editor
-- This will fix ALL database issues in one go

-- =====================================================
-- STEP 1: PROFILES TABLE
-- =====================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  credits_remaining INTEGER DEFAULT 5,
  total_workflows_created INTEGER DEFAULT 0,
  total_workflows_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create RLS policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 2: WORKFLOWS TABLE - FIX/CREATE
-- =====================================================

-- Check if workflows table exists and drop it if needed (CAREFUL!)
-- Uncomment ONLY if you want to start fresh (deletes all workflows!)
-- DROP TABLE IF EXISTS public.workflows CASCADE;

-- Create workflows table with ALL required columns
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT DEFAULT 'n8n' NOT NULL,
  workflow_json JSONB NOT NULL,
  prompt TEXT,
  template_used TEXT,
  credits_used INTEGER DEFAULT 1,
  tokens_used INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Add constraint for status
  CONSTRAINT workflows_status_check CHECK (status IN ('success', 'failed', 'pending'))
);

-- Add missing columns to existing workflows table (safe - runs only if table exists)
DO $$
BEGIN
  -- Add user_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added user_id column';
  END IF;

  -- Add credits_used if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'credits_used'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN credits_used INTEGER DEFAULT 1;
    RAISE NOTICE 'Added credits_used column';
  END IF;

  -- Add tokens_used if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'tokens_used'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN tokens_used INTEGER DEFAULT 0;
    RAISE NOTICE 'Added tokens_used column';
  END IF;

  -- Add is_favorite if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_favorite column';
  END IF;

  -- Add tags if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN tags TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added tags column';
  END IF;

  -- Add status if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN status TEXT DEFAULT 'success';
    ALTER TABLE public.workflows ADD CONSTRAINT workflows_status_check CHECK (status IN ('success', 'failed', 'pending'));
    RAISE NOTICE 'Added status column';
  END IF;

  -- Add error_message if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN error_message TEXT;
    RAISE NOTICE 'Added error_message column';
  END IF;

  -- Add prompt if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'prompt'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN prompt TEXT;
    RAISE NOTICE 'Added prompt column';
  END IF;

  -- Add template_used if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'template_used'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN template_used TEXT;
    RAISE NOTICE 'Added template_used column';
  END IF;
END $$;

-- Enable RLS on workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can insert own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can update own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can delete own workflows" ON public.workflows;

-- Create RLS policies for workflows
CREATE POLICY "Users can view own workflows"
  ON public.workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflows"
  ON public.workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON public.workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows"
  ON public.workflows FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 3: AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================

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

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 4: CREATE PROFILE FOR EXISTING USERS
-- =====================================================

-- This will create profiles for any existing users who don't have one
INSERT INTO public.profiles (id, email, full_name, credits_remaining)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  5 as credits_remaining
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 5: RELOAD SCHEMA CACHE
-- =====================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- =====================================================
-- STEP 6: VERIFICATION
-- =====================================================

-- Show all tables in public schema
SELECT
  '📋 ALL TABLES' as info,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- Show profiles table columns
SELECT
  '👤 PROFILES COLUMNS' as info,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Show workflows table columns
SELECT
  '⚙️ WORKFLOWS COLUMNS' as info,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workflows'
ORDER BY ordinal_position;

-- Show current users and their profiles
SELECT
  '👥 USERS STATUS' as info,
  u.id,
  u.email,
  CASE WHEN p.id IS NOT NULL THEN 'Has Profile' ELSE 'No Profile' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- Final status
SELECT '✅ SETUP COMPLETE! Now refresh your browser and try saving a workflow!' as status;
