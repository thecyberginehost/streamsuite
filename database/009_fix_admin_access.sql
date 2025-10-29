-- 009_fix_admin_access.sql
-- Fix admin access by creating RLS bypass function and cleaning up duplicate policies

-- =====================================================
-- STEP 1: Create RLS bypass function for admin check
-- =====================================================

-- Drop if exists
DROP FUNCTION IF EXISTS is_user_admin(UUID);

-- Create function that bypasses RLS to check admin status
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$;

-- =====================================================
-- STEP 2: Remove duplicate policies
-- =====================================================

-- Drop old duplicate policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Keep only these policies:
-- - "Users can view their own profile" (SELECT - own profile)
-- - "Users can update their own profile" (UPDATE - own profile)
-- - "Users can insert own profile" (INSERT - for new users)
-- - "Admins can view all profiles" (SELECT - all profiles for admins)
-- - "Admins can update all profiles" (UPDATE - all profiles for admins)

-- =====================================================
-- STEP 3: Verify setup
-- =====================================================

-- Test the function
SELECT is_user_admin(auth.uid()) as "Am I Admin?";

-- List all policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
