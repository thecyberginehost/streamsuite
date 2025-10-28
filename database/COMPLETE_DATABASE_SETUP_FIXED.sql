-- =====================================================
-- COMPLETE DATABASE SETUP FOR STREAMSUITE (FIXED)
-- =====================================================
-- Run this entire script in Supabase SQL Editor
-- This will fix ALL database issues in one go

-- =====================================================
-- STEP 1: PROFILES TABLE - FIX EXISTING TABLE
-- =====================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add missing columns to profiles table (safe - checks before adding)
DO $$
BEGIN
  -- Add email if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
    RAISE NOTICE 'Added email column to profiles';
  END IF;

  -- Add full_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    RAISE NOTICE 'Added full_name column to profiles';
  END IF;

  -- Add avatar_url if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    RAISE NOTICE 'Added avatar_url column to profiles';
  END IF;

  -- Add subscription_tier if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
    RAISE NOTICE 'Added subscription_tier column to profiles';
  END IF;

  -- Add credits_remaining if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'credits_remaining'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN credits_remaining INTEGER DEFAULT 5;
    RAISE NOTICE 'Added credits_remaining column to profiles';
  END IF;

  -- Add total_workflows_created if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'total_workflows_created'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN total_workflows_created INTEGER DEFAULT 0;
    RAISE NOTICE 'Added total_workflows_created column to profiles';
  END IF;

  -- Add total_workflows_generated if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'total_workflows_generated'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN total_workflows_generated INTEGER DEFAULT 0;
    RAISE NOTICE 'Added total_workflows_generated column to profiles';
  END IF;

  -- Add created_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added created_at column to profiles';
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to profiles';
  END IF;
END $$;

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

-- Create workflows table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  platform TEXT DEFAULT 'n8n' NOT NULL,
  workflow_json JSONB NOT NULL
);

-- Add missing columns to workflows table (safe - checks before adding)
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

  -- Add description if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column';
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

  -- Add created_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added created_at column';
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;
END $$;

-- Add status constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'workflows_status_check'
  ) THEN
    ALTER TABLE public.workflows ADD CONSTRAINT workflows_status_check CHECK (status IN ('success', 'failed', 'pending'));
    RAISE NOTICE 'Added status constraint';
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
  INSERT INTO public.profiles (id, email, full_name, credits_remaining)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    5
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
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
