-- =====================================================
-- Migration 017: Template Restrictions & Auto-Save History
-- =====================================================
-- This migration adds:
-- 1. Template access restrictions (Starter gets 3 templates, Pro+ gets all)
-- 2. Auto-save history for Pro, Growth, and Agency tiers
-- 3. Helper functions to check feature access
-- =====================================================

-- =====================================================
-- STEP 1: Add template metadata table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT, -- 'beginner', 'intermediate', 'advanced'
  is_featured BOOLEAN DEFAULT false,
  is_starter_accessible BOOLEAN DEFAULT false, -- true if accessible to Starter tier (3 only)
  template_data JSONB NOT NULL, -- The actual workflow JSON
  preview_image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read templates (access control in app layer)
CREATE POLICY "workflow_templates_select_policy"
  ON public.workflow_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert/update/delete templates
CREATE POLICY "workflow_templates_admin_policy"
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

-- =====================================================
-- STEP 2: Add auto_save_enabled flag to workflows table
-- =====================================================
DO $$
BEGIN
  -- Add auto_saved flag to workflows table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'auto_saved'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN auto_saved BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added auto_saved column to workflows table';
  END IF;
END $$;

-- Add comment to auto_saved column
COMMENT ON COLUMN public.workflows.auto_saved IS 'Whether this workflow was auto-saved (Pro+) or manually saved (Free/Starter)';

-- =====================================================
-- STEP 3: Create helper functions for feature access
-- =====================================================

-- Function to check if user has auto-save history enabled
CREATE OR REPLACE FUNCTION public.has_auto_save_history(user_tier TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_tier IN ('pro', 'growth', 'agency');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if user has full template access
CREATE OR REPLACE FUNCTION public.has_full_template_access(user_tier TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_tier IN ('pro', 'growth', 'agency');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if user can access a specific template
CREATE OR REPLACE FUNCTION public.can_access_template(user_tier TEXT, template_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  template_is_starter_accessible BOOLEAN;
  has_full_access BOOLEAN;
BEGIN
  -- Check if user has full access
  has_full_access := has_full_template_access(user_tier);

  IF has_full_access THEN
    RETURN true;
  END IF;

  -- For Starter tier, check if template is marked as starter-accessible
  IF user_tier = 'starter' THEN
    SELECT is_starter_accessible INTO template_is_starter_accessible
    FROM public.workflow_templates
    WHERE id = template_id;

    RETURN COALESCE(template_is_starter_accessible, false);
  END IF;

  -- Free tier has no template access
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- STEP 4: Seed initial template data (3 starter templates)
-- =====================================================

-- Insert 3 starter-accessible templates (examples - replace with actual templates)
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
    true, -- Starter accessible
    '{"nodes": [], "connections": {}}'::jsonb, -- Replace with actual workflow JSON
    ARRAY['webhook', 'email', 'notifications']
  ),
  (
    'Form Submission to Notion',
    'form-to-notion',
    'Automatically save form submissions to a Notion database',
    'Productivity',
    'beginner',
    true,
    true, -- Starter accessible
    '{"nodes": [], "connections": {}}'::jsonb, -- Replace with actual workflow JSON
    ARRAY['forms', 'notion', 'database']
  ),
  (
    'Scheduled Data Backup',
    'scheduled-backup',
    'Automatically backup data to cloud storage on a schedule',
    'Data Management',
    'beginner',
    true,
    true, -- Starter accessible
    '{"nodes": [], "connections": {}}'::jsonb, -- Replace with actual workflow JSON
    ARRAY['backup', 'schedule', 'storage']
  )
ON CONFLICT (template_slug) DO NOTHING;

-- =====================================================
-- STEP 5: Create view for template access control
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

-- Grant access to the view
GRANT SELECT ON public.accessible_templates TO authenticated;

-- =====================================================
-- STEP 6: Add indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_workflow_templates_slug ON public.workflow_templates(template_slug);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_starter_accessible ON public.workflow_templates(is_starter_accessible) WHERE is_starter_accessible = true;
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON public.workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflows_auto_saved ON public.workflows(auto_saved);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration 017 completed successfully!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '  - workflow_templates table';
  RAISE NOTICE '  - auto_saved column to workflows';
  RAISE NOTICE '  - Helper functions for feature access';
  RAISE NOTICE '  - 3 starter templates seeded';
  RAISE NOTICE '  - accessible_templates view';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Replace template_data with actual n8n workflows';
  RAISE NOTICE '  2. Add more templates (Pro+ only)';
  RAISE NOTICE '  3. Update frontend to use accessible_templates view';
  RAISE NOTICE '  4. Implement auto-save logic in workflow generation';
  RAISE NOTICE '==============================================';
END $$;
