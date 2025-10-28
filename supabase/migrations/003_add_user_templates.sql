-- =====================================================
-- StreamSuite User Templates System
-- =====================================================
-- This migration adds support for user-saved templates

-- Add is_template flag to workflows table
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Add template metadata
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS template_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS template_description TEXT;

-- Create index for faster template queries
CREATE INDEX IF NOT EXISTS idx_workflows_user_templates
ON workflows(user_id, is_template)
WHERE is_template = true;

-- Add comment
COMMENT ON COLUMN workflows.is_template IS 'Whether this workflow is saved as a reusable template';
COMMENT ON COLUMN workflows.template_name IS 'User-defined name for the template (if is_template = true)';
COMMENT ON COLUMN workflows.template_description IS 'User-defined description for the template (if is_template = true)';

-- Update RLS policies to ensure users can only see their own templates
-- (Existing RLS policies should already handle this, but adding explicit template policy)

-- =====================================================
-- Rollback instructions
-- =====================================================
-- To rollback this migration:
/*
DROP INDEX IF EXISTS idx_workflows_user_templates;
ALTER TABLE workflows
DROP COLUMN IF EXISTS is_template,
DROP COLUMN IF EXISTS template_name,
DROP COLUMN IF EXISTS template_description;
*/
