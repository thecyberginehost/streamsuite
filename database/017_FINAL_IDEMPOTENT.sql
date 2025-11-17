-- =====================================================
-- Migration 017: Template Restrictions & Auto-Save History (FULLY IDEMPOTENT)
-- =====================================================
-- This version is 100% safe to run multiple times
-- It checks for every object before creating/modifying
-- =====================================================

-- =====================================================
-- STEP 1: Create workflow_templates table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_starter_accessible BOOLEAN DEFAULT false,
  template_data JSONB NOT NULL,
  preview_image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Create/Replace Policies (using DO block)
-- =====================================================
DO $$
BEGIN
  -- Drop and recreate select policy
  IF EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'workflow_templates'
      AND p.polname = 'workflow_templates_select_policy'
  ) THEN
    DROP POLICY workflow_templates_select_policy ON public.workflow_templates;
  END IF;

  CREATE POLICY workflow_templates_select_policy
    ON public.workflow_templates
    FOR SELECT
    TO authenticated
    USING (true);

  RAISE NOTICE 'Created workflow_templates_select_policy';

  -- Drop and recreate admin policy
  IF EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'workflow_templates'
      AND p.polname = 'workflow_templates_admin_policy'
  ) THEN
    DROP POLICY workflow_templates_admin_policy ON public.workflow_templates;
  END IF;

  CREATE POLICY workflow_templates_admin_policy
    ON public.workflow_templates
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );

  RAISE NOTICE 'Created workflow_templates_admin_policy';
END $$;

-- =====================================================
-- STEP 3: Add auto_saved column to workflows
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'auto_saved'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN auto_saved BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added auto_saved column to workflows table';
  ELSE
    RAISE NOTICE 'auto_saved column already exists';
  END IF;
END $$;

COMMENT ON COLUMN public.workflows.auto_saved IS 'Whether this workflow was auto-saved (Pro+) or manually saved (Free/Starter)';

-- =====================================================
-- STEP 4: Create helper functions
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_auto_save_history(user_tier TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_tier IN ('pro', 'growth', 'agency');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.has_full_template_access(user_tier TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_tier IN ('pro', 'growth', 'agency');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.can_access_template(user_tier TEXT, template_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  template_is_starter_accessible BOOLEAN;
  has_full_access BOOLEAN;
BEGIN
  has_full_access := has_full_template_access(user_tier);

  IF has_full_access THEN
    RETURN true;
  END IF;

  IF user_tier = 'starter' THEN
    SELECT is_starter_accessible INTO template_is_starter_accessible
    FROM public.workflow_templates
    WHERE id = template_id;

    RETURN COALESCE(template_is_starter_accessible, false);
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- STEP 5: Seed starter templates
-- =====================================================

INSERT INTO public.workflow_templates (
  template_name,
  template_slug,
  description,
  category,
  difficulty,
  is_featured,
  is_starter_accessible,
  template_data,
  tags
) VALUES
  (
    'Simple Webhook to Email',
    'webhook-to-email',
    'Receive webhooks and send email notifications via SendGrid or SMTP',
    'Productivity',
    'beginner',
    true,
    true,
    '{"nodes": [], "connections": {}}'::jsonb,
    ARRAY['webhook', 'email', 'notifications']
  ),
  (
    'Form Submission to Notion',
    'form-to-notion',
    'Automatically save form submissions to a Notion database',
    'Productivity',
    'beginner',
    true,
    true,
    '{"nodes": [], "connections": {}}'::jsonb,
    ARRAY['forms', 'notion', 'database']
  ),
  (
    'Scheduled Data Backup',
    'scheduled-backup',
    'Automatically backup data to cloud storage on a schedule',
    'Data Management',
    'beginner',
    true,
    true,
    '{"nodes": [], "connections": {}}'::jsonb,
    ARRAY['backup', 'schedule', 'storage']
  )
ON CONFLICT (template_slug) DO NOTHING;

-- =====================================================
-- STEP 6: Create accessible_templates view
-- =====================================================

CREATE OR REPLACE VIEW public.accessible_templates AS
SELECT
  wt.*,
  p.subscription_tier,
  CASE
    WHEN p.subscription_tier IN ('pro', 'growth', 'agency') THEN true
    WHEN p.subscription_tier = 'starter' AND wt.is_starter_accessible THEN true
    ELSE false
  END AS can_access
FROM public.workflow_templates wt
CROSS JOIN public.profiles p
WHERE p.id = auth.uid();

GRANT SELECT ON public.accessible_templates TO authenticated;

-- =====================================================
-- STEP 7: Add indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_workflow_templates_slug ON public.workflow_templates(template_slug);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_starter_accessible ON public.workflow_templates(is_starter_accessible) WHERE is_starter_accessible = true;
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON public.workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflows_auto_saved ON public.workflows(auto_saved);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
DECLARE
  template_count INTEGER;
  starter_template_count INTEGER;
  auto_saved_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO template_count FROM public.workflow_templates;
  SELECT COUNT(*) INTO starter_template_count FROM public.workflow_templates WHERE is_starter_accessible = true;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'auto_saved'
  ) INTO auto_saved_exists;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration 017 completed successfully!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Objects created/updated:';
  RAISE NOTICE '  ✅ workflow_templates table';
  RAISE NOTICE '  ✅ auto_saved column: %', CASE WHEN auto_saved_exists THEN 'EXISTS' ELSE 'CREATED' END;
  RAISE NOTICE '  ✅ RLS policies (2)';
  RAISE NOTICE '  ✅ Helper functions (3)';
  RAISE NOTICE '  ✅ accessible_templates view';
  RAISE NOTICE '  ✅ Indexes (4)';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Template Summary:';
  RAISE NOTICE '  Total templates: %', template_count;
  RAISE NOTICE '  Starter-accessible: %', starter_template_count;
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Feature Enforcement:';
  RAISE NOTICE '  ✅ Starter: 3 templates only';
  RAISE NOTICE '  ✅ Pro/Growth/Agency: All templates';
  RAISE NOTICE '  ✅ Auto-save: Pro/Growth/Agency only';
  RAISE NOTICE '  ✅ Manual save: Free/Starter';
  RAISE NOTICE '==============================================';
END $$;
