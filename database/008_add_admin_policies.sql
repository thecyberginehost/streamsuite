-- 008_add_admin_policies.sql
-- Add RLS policies to allow admins to view and manage all users

-- =====================================================
-- ADMIN POLICIES FOR PROFILES TABLE
-- =====================================================

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- =====================================================
-- ADMIN POLICIES FOR WORKFLOWS TABLE
-- =====================================================

-- Allow admins to view all workflows
CREATE POLICY "Admins can view all workflows"
  ON public.workflows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- =====================================================
-- ADMIN POLICIES FOR CREDIT TRANSACTIONS TABLE
-- =====================================================

-- Allow admins to view all credit transactions
CREATE POLICY "Admins can view all transactions"
  ON public.credit_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that policies were created successfully
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('profiles', 'workflows', 'credit_transactions')
  AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;
