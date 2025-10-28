-- =====================================================
-- StreamSuite MVP - Database Schema Update
-- Add status tracking for workflows
-- =====================================================
-- Run this AFTER the main SUPABASE_SETUP.sql if you've already set up the database

-- Add status column to workflows table (if it doesn't exist)
ALTER TABLE public.workflows
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending'));

-- Add error_message column for debugging
ALTER TABLE public.workflows
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);

-- Add comment for documentation
COMMENT ON COLUMN public.workflows.status IS 'Workflow generation status: success (working), failed (not working), pending (not tested)';
COMMENT ON COLUMN public.workflows.error_message IS 'Error message if workflow failed or debugging information';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- Schema updated successfully!
-- You can now track workflow success/failure status.
