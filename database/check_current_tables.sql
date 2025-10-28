-- Check what tables currently exist in your Supabase project
-- Run this in Supabase SQL Editor to see current state

-- List all tables in public schema
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if workflows table exists
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflows')
    THEN '✅ workflows table EXISTS'
    ELSE '❌ workflows table MISSING'
  END as workflows_status;

-- Check if profiles table exists
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
    THEN '✅ profiles table EXISTS'
    ELSE '❌ profiles table MISSING'
  END as profiles_status;

-- If workflows exists, show its columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'workflows'
ORDER BY ordinal_position;
