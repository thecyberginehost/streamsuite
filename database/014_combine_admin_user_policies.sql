-- =====================================================
-- 014_combine_admin_user_policies.sql
-- Combine Admin + User Policies into Single Policies
-- =====================================================
-- This migration combines separate "user" and "admin" policies
-- into single policies with OR logic for better performance.
--
-- Issue: Having 2 policies (user + admin) means Postgres evaluates
-- both policies for every query, even if only one applies.
--
-- Solution: Combine into 1 policy with OR logic:
--   USING ((user_id = current_user) OR is_admin(current_user))
--
-- Performance: 1 policy evaluation instead of 2 per query
-- =====================================================

-- =====================================================
-- PROFILES TABLE
-- =====================================================

-- Drop separate user + admin SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create combined SELECT policy
CREATE POLICY "Users can view own profile, admins can view all"
  ON public.profiles FOR SELECT
  USING (
    (select auth.uid()) = id
    OR is_user_admin((select auth.uid()))
  );

-- Drop separate user + admin UPDATE policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create combined UPDATE policy
CREATE POLICY "Users can update own profile, admins can update all"
  ON public.profiles FOR UPDATE
  USING (
    (select auth.uid()) = id
    OR is_user_admin((select auth.uid()))
  );

-- =====================================================
-- WORKFLOWS TABLE
-- =====================================================

-- Drop separate user + admin SELECT policies
DROP POLICY IF EXISTS "Users can view own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Admins can view all workflows" ON public.workflows;

-- Create combined SELECT policy
CREATE POLICY "Users can view own workflows, admins can view all"
  ON public.workflows FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR is_user_admin((select auth.uid()))
  );

-- =====================================================
-- CREDIT_TRANSACTIONS TABLE
-- =====================================================

-- Drop separate user + admin SELECT policies
DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.credit_transactions;

-- Create combined SELECT policy
CREATE POLICY "Users can view own transactions, admins can view all"
  ON public.credit_transactions FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR is_user_admin((select auth.uid()))
  );

-- =====================================================
-- N8N_CONNECTIONS TABLE
-- =====================================================

-- Drop separate user + admin SELECT policies
DROP POLICY IF EXISTS "Users can view their own connections" ON public.n8n_connections;
DROP POLICY IF EXISTS "Admins can view all connections" ON public.n8n_connections;

-- Create combined SELECT policy
CREATE POLICY "Users can view own connections, admins can view all"
  ON public.n8n_connections FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR is_user_admin((select auth.uid()))
  );

-- =====================================================
-- PUSHED_WORKFLOWS TABLE
-- =====================================================

-- Drop separate user + admin SELECT policies
DROP POLICY IF EXISTS "Users can view their own pushed workflows" ON public.pushed_workflows;
DROP POLICY IF EXISTS "Admins can view all pushed workflows" ON public.pushed_workflows;

-- Create combined SELECT policy
CREATE POLICY "Users can view own pushed workflows, admins can view all"
  ON public.pushed_workflows FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR is_user_admin((select auth.uid()))
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Count remaining policies per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'workflows',
    'credit_transactions',
    'n8n_connections',
    'pushed_workflows'
  )
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Verify NO duplicate permissive policies remain
-- (This query should return 0 rows)
SELECT
  schemaname,
  tablename,
  cmd as action,
  COUNT(*) as duplicate_count
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
GROUP BY schemaname, tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

-- =====================================================
-- NOTES
-- =====================================================
--
-- Policies combined:
-- ✅ profiles: 2 SELECT policies → 1 combined policy
-- ✅ profiles: 2 UPDATE policies → 1 combined policy
-- ✅ workflows: 2 SELECT policies → 1 combined policy
-- ✅ credit_transactions: 2 SELECT policies → 1 combined policy
-- ✅ n8n_connections: 2 SELECT policies → 1 combined policy
-- ✅ pushed_workflows: 2 SELECT policies → 1 combined policy
-- ✅ Total: 12 policies combined into 6 policies
--
-- How it works:
-- - Users: Can only see records where user_id = their ID
-- - Admins: Can see ALL records (is_user_admin returns true)
-- - Combined with OR: Either condition allows access
--
-- Performance impact:
-- - Before: Postgres evaluates 2 policies per query
-- - After: Postgres evaluates 1 policy per query
-- - Result: ~50% fewer policy evaluations
--
-- Functionality:
-- - Users still see only their own data ✅
-- - Admins still see all data ✅
-- - No breaking changes ✅
--
-- This fixes all remaining "multiple_permissive_policies" warnings!
-- =====================================================
