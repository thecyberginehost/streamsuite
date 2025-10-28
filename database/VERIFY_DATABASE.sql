-- =====================================================
-- Verify StreamSuite Database Setup
-- =====================================================
-- Run this to check what tables exist and their status
-- =====================================================

-- 1. List all tables in public schema
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check if RLS is enabled on tables
SELECT
  tablename as table_name,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. List all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. List all indexes
SELECT
  tablename as table_name,
  indexname as index_name
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. List all triggers
SELECT
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. List all functions
SELECT
  routine_name as function_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 7. Count rows in each table (to verify data)
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
UNION ALL
SELECT 'workflows', COUNT(*) FROM public.workflows
UNION ALL
SELECT 'credit_transactions', COUNT(*) FROM public.credit_transactions;

-- =====================================================
-- Expected Results:
-- =====================================================
-- Tables: profiles, workflows, credit_transactions
-- RLS: All 3 tables should have rowsecurity = true
-- Policies: 7 policies total (2 for profiles, 4 for workflows, 1 for credit_transactions)
-- Indexes: 7 indexes total
-- Triggers: 3 triggers (on_auth_user_created, set_updated_at_profiles, set_updated_at_workflows)
-- Functions: 5 functions (handle_new_user, handle_updated_at, deduct_credits, add_credits, get_user_credits)
-- =====================================================
