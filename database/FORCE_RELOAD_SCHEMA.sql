-- =====================================================
-- FORCE RELOAD SUPABASE SCHEMA CACHE
-- =====================================================
-- Run this AFTER running the setup script
-- This forces Supabase PostgREST to recognize new columns

-- Method 1: Standard reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Method 2: Pause and resume (run these one at a time if above doesn't work)
-- Step 1: Pause PostgREST connections
-- ALTER ROLE authenticator NOLOGIN;

-- Step 2: Resume PostgREST connections
-- ALTER ROLE authenticator LOGIN;

-- Verify tables exist
SELECT 'Checking profiles table...' as status;
SELECT COUNT(*) as profile_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles';

SELECT 'Checking workflows table...' as status;
SELECT COUNT(*) as workflow_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workflows';

-- Check if user_id column exists in workflows
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'user_id'
    )
    THEN '✅ user_id column EXISTS in workflows'
    ELSE '❌ user_id column MISSING in workflows'
  END as user_id_status;

-- Check if credits_used column exists in workflows
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'credits_used'
    )
    THEN '✅ credits_used column EXISTS in workflows'
    ELSE '❌ credits_used column MISSING in workflows'
  END as credits_used_status;
