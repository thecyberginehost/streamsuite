-- Migration: Add Template Folders System
-- Description: Allow users to organize their saved templates into folders
-- Date: 2025-10-18

-- =====================================================
-- CREATE TEMPLATE FOLDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS template_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure folder names are unique per user
  CONSTRAINT unique_folder_name_per_user UNIQUE (user_id, name)
);

-- Add index for fast folder queries
CREATE INDEX idx_template_folders_user_id ON template_folders(user_id);
CREATE INDEX idx_template_folders_created_at ON template_folders(created_at DESC);

-- =====================================================
-- ADD FOLDER_ID TO WORKFLOWS TABLE
-- =====================================================

-- Add folder_id column to workflows table (nullable - templates can exist without folders)
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES template_folders(id) ON DELETE SET NULL;

-- Add index for fast folder-based queries
CREATE INDEX IF NOT EXISTS idx_workflows_folder_id ON workflows(folder_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on template_folders table
ALTER TABLE template_folders ENABLE ROW LEVEL SECURITY;

-- Users can view their own folders
CREATE POLICY "Users can view their own template folders"
  ON template_folders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own folders
CREATE POLICY "Users can create their own template folders"
  ON template_folders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own folders
CREATE POLICY "Users can update their own template folders"
  ON template_folders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own folders
CREATE POLICY "Users can delete their own template folders"
  ON template_folders
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPFUL COMMENTS
-- =====================================================

COMMENT ON TABLE template_folders IS 'User-created folders for organizing saved workflow templates';
COMMENT ON COLUMN template_folders.user_id IS 'User who owns this folder';
COMMENT ON COLUMN template_folders.name IS 'Folder name (unique per user)';
COMMENT ON COLUMN template_folders.description IS 'Optional folder description';
COMMENT ON COLUMN workflows.folder_id IS 'Optional folder assignment for template workflows';
