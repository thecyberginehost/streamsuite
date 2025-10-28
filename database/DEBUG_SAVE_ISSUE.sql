-- =====================================================
-- DEBUG: Why Can't I Save Workflows?
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose the issue

-- Step 1: Check if you're logged in and have a profile
SELECT 'Step 1: Check user authentication' as debug_step;

SELECT
  u.id as user_id,
  u.email,
  p.id as profile_id,
  p.credits_remaining,
  CASE WHEN p.id IS NOT NULL THEN '✅ Profile exists' ELSE '❌ No profile' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;

-- Step 2: Check workflows table structure
SELECT 'Step 2: Verify workflows table columns' as debug_step;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workflows'
ORDER BY ordinal_position;

-- Step 3: Check RLS policies on workflows table
SELECT 'Step 3: Check Row Level Security policies' as debug_step;

SELECT
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'workflows';

-- Step 4: Try to manually insert a test workflow (using your user ID)
SELECT 'Step 4: Attempting test insert...' as debug_step;

-- First, get the current user ID
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the first user (change this to your actual user ID if needed)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;

  -- Try to insert a test workflow
  INSERT INTO public.workflows (
    user_id,
    name,
    platform,
    workflow_json,
    credits_used,
    tokens_used,
    status
  )
  VALUES (
    test_user_id,
    'Test Workflow',
    'n8n',
    '{"nodes": [], "connections": {}}'::jsonb,
    1,
    0,
    'success'
  );

  RAISE NOTICE 'Test insert SUCCESS! Workflows table is working.';

  -- Clean up test data
  DELETE FROM public.workflows WHERE name = 'Test Workflow';
  RAISE NOTICE 'Test workflow cleaned up.';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test insert FAILED: %', SQLERRM;
END $$;

-- Step 5: Check if there are any workflows in the table
SELECT 'Step 5: Check existing workflows' as debug_step;

SELECT
  COUNT(*) as total_workflows,
  COUNT(DISTINCT user_id) as unique_users
FROM public.workflows;

-- Final diagnostic summary
SELECT 'Diagnostic complete! Check the output above for issues.' as summary;
