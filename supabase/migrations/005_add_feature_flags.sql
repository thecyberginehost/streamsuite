-- Migration: Add Feature Flags for Platform Support
-- Description: Admin-controlled feature flags for enabling/disabling Make.com and Zapier code generation
-- Date: 2025-10-18

-- =====================================================
-- CREATE FEATURE FLAGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(100) NOT NULL UNIQUE,
  flag_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- =====================================================
-- INSERT DEFAULT FEATURE FLAGS
-- =====================================================

-- Workflow generation platform flags (disabled by default for MVP)
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled) VALUES
  ('workflow_generation_make', 'Make.com Workflow Generation', 'Enable AI workflow generation for Make.com platform', false),
  ('workflow_generation_zapier', 'Zapier Workflow Generation', 'Enable AI workflow generation for Zapier platform', false)
ON CONFLICT (flag_key) DO NOTHING;

-- Code generation platform flags (disabled by default for MVP)
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled) VALUES
  ('code_generation_make', 'Make.com Code Generation', 'Enable custom code generation for Make.com modules', false),
  ('code_generation_zapier', 'Zapier Code Generation', 'Enable custom code generation for Zapier Code by Zapier steps', false)
ON CONFLICT (flag_key) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on feature_flags table
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags (needed for UI to check if features are enabled)
DROP POLICY IF EXISTS "Anyone can view feature flags" ON feature_flags;
CREATE POLICY "Anyone can view feature flags"
  ON feature_flags
  FOR SELECT
  USING (true);

-- Only admins can update feature flags
DROP POLICY IF EXISTS "Admins can update feature flags" ON feature_flags;
CREATE POLICY "Admins can update feature flags"
  ON feature_flags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- HELPFUL COMMENTS
-- =====================================================

COMMENT ON TABLE feature_flags IS 'Feature flags for controlling platform features (admin-only control)';
COMMENT ON COLUMN feature_flags.flag_key IS 'Unique key for programmatic access (e.g., code_generation_make)';
COMMENT ON COLUMN feature_flags.flag_name IS 'Human-readable name for admin panel';
COMMENT ON COLUMN feature_flags.description IS 'Description of what this flag controls';
COMMENT ON COLUMN feature_flags.is_enabled IS 'Whether this feature is currently enabled';
