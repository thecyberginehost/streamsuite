-- =====================================================
-- Diagnostic Query: Check Migration 017 Status
-- =====================================================
-- Run this first to see what parts of Migration 017 are already applied
-- =====================================================

-- Check if workflow_templates table exists
SELECT
  'workflow_templates table' AS object_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'workflow_templates'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- Check if auto_saved column exists on workflows table
SELECT
  'workflows.auto_saved column' AS object_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'auto_saved'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- Check existing policies on workflow_templates
SELECT
  'Policy: ' || polname AS object_name,
  '✅ EXISTS' AS status
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'workflow_templates';

-- Check if helper functions exist
SELECT
  'Function: ' || routine_name AS object_name,
  '✅ EXISTS' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('has_auto_save_history', 'has_full_template_access', 'can_access_template');

-- Check if accessible_templates view exists
SELECT
  'accessible_templates view' AS object_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public' AND table_name = 'accessible_templates'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status;

-- Count templates
SELECT
  'Template count' AS object_name,
  COALESCE(COUNT(*)::TEXT, '0') || ' templates' AS status
FROM public.workflow_templates;

-- Count starter templates
SELECT
  'Starter template count' AS object_name,
  COALESCE(COUNT(*)::TEXT, '0') || ' templates' AS status
FROM public.workflow_templates
WHERE is_starter_accessible = true;
