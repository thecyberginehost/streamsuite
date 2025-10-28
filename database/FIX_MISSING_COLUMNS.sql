-- =====================================================
-- FIX MISSING COLUMNS FOR STREAMSUITE
-- =====================================================
-- Run this in Supabase SQL Editor to add missing fields
-- This is safe to run multiple times (checks before adding)

-- =====================================================
-- ADD MISSING COLUMNS TO PROFILES
-- =====================================================

DO $$
BEGIN
  -- Add display_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
    RAISE NOTICE 'Added display_name column to profiles';
  END IF;

  -- Add commercial_license_active if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'commercial_license_active'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN commercial_license_active BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added commercial_license_active column to profiles';
  END IF;
END $$;

-- =====================================================
-- ENSURE RLS IS ENABLED
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_credit_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE/UPDATE RLS POLICIES
-- =====================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Workflows policies
DROP POLICY IF EXISTS "Users can view own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can insert own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can update own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can delete own workflows" ON public.workflows;

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

-- Credit transactions policies
DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can insert own credit transactions" ON public.credit_transactions;

CREATE POLICY "Users can view own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Template folders policies
DROP POLICY IF EXISTS "Users can view own folders" ON public.template_folders;
DROP POLICY IF EXISTS "Users can insert own folders" ON public.template_folders;
DROP POLICY IF EXISTS "Users can update own folders" ON public.template_folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON public.template_folders;

CREATE POLICY "Users can view own folders"
  ON public.template_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
  ON public.template_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON public.template_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON public.template_folders FOR DELETE
  USING (auth.uid() = user_id);

-- Feature flags policies (read-only for all authenticated users)
DROP POLICY IF EXISTS "Anyone can view feature flags" ON public.feature_flags;

CREATE POLICY "Anyone can view feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Batch credit transactions policies
DROP POLICY IF EXISTS "Users can view own batch transactions" ON public.batch_credit_transactions;
DROP POLICY IF EXISTS "Users can insert own batch transactions" ON public.batch_credit_transactions;

CREATE POLICY "Users can view own batch transactions"
  ON public.batch_credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batch transactions"
  ON public.batch_credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    display_name,
    credits_remaining,
    bonus_credits,
    subscription_tier
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    5,
    0,
    'free'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- CREATE PROFILES FOR EXISTING USERS
-- =====================================================

-- Backfill profiles for any existing users
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  display_name,
  credits_remaining,
  bonus_credits,
  subscription_tier
)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  COALESCE(raw_user_meta_data->>'display_name', email) as display_name,
  5 as credits_remaining,
  0 as bonus_credits,
  'free' as subscription_tier
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to tables that need them
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.workflows;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.template_folders;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.template_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- RELOAD SCHEMA CACHE
-- =====================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT '✅ Checking profiles columns...' as status;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT '✅ Migration complete! Refresh your app and test.' as status;
