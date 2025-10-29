-- Migration: n8n Integration Tables
-- Description: Add tables for n8n connections and pushed workflows
-- Version: 007
-- Date: 2025-10-29

-- ============================================================================
-- TABLE: n8n_connections
-- Stores user's n8n instance connections
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.n8n_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_name TEXT NOT NULL,
  instance_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  last_test_success BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_n8n_connections_user_id ON public.n8n_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_connections_active ON public.n8n_connections(user_id, is_active);

-- RLS Policies for n8n_connections
ALTER TABLE public.n8n_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections
CREATE POLICY "Users can view own n8n connections"
  ON public.n8n_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own connections
CREATE POLICY "Users can insert own n8n connections"
  ON public.n8n_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update own n8n connections"
  ON public.n8n_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete own n8n connections"
  ON public.n8n_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: pushed_workflows
-- Tracks workflows pushed to n8n instances
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pushed_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.n8n_connections(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  workflow_id TEXT, -- n8n workflow ID (if push succeeded)
  workflow_json JSONB NOT NULL,
  push_status TEXT NOT NULL CHECK (push_status IN ('success', 'failed')),
  error_message TEXT,
  pushed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Execution stats (updated by monitoring)
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  last_execution_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pushed_workflows_user_id ON public.pushed_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_pushed_workflows_connection_id ON public.pushed_workflows(connection_id);
CREATE INDEX IF NOT EXISTS idx_pushed_workflows_status ON public.pushed_workflows(user_id, push_status);
CREATE INDEX IF NOT EXISTS idx_pushed_workflows_pushed_at ON public.pushed_workflows(pushed_at DESC);

-- RLS Policies for pushed_workflows
ALTER TABLE public.pushed_workflows ENABLE ROW LEVEL SECURITY;

-- Users can view their own pushed workflows
CREATE POLICY "Users can view own pushed workflows"
  ON public.pushed_workflows
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own pushed workflows
CREATE POLICY "Users can insert own pushed workflows"
  ON public.pushed_workflows
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pushed workflows
CREATE POLICY "Users can update own pushed workflows"
  ON public.pushed_workflows
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own pushed workflows
CREATE POLICY "Users can delete own pushed workflows"
  ON public.pushed_workflows
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for n8n_connections
CREATE TRIGGER update_n8n_connections_updated_at
  BEFORE UPDATE ON public.n8n_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.n8n_connections IS 'Stores user n8n instance connections for Pro+ plans';
COMMENT ON TABLE public.pushed_workflows IS 'Tracks workflows pushed to n8n instances with execution stats';

COMMENT ON COLUMN public.n8n_connections.api_key IS 'Encrypted n8n API key - stored securely';
COMMENT ON COLUMN public.n8n_connections.last_test_success IS 'NULL = never tested, TRUE = last test passed, FALSE = last test failed';

COMMENT ON COLUMN public.pushed_workflows.workflow_id IS 'The n8n workflow ID returned after successful push';
COMMENT ON COLUMN public.pushed_workflows.push_status IS 'success or failed - tracks if push operation succeeded';
COMMENT ON COLUMN public.pushed_workflows.total_executions IS 'Cached count - updated by monitoring feature (Growth plan)';
