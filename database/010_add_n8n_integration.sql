-- 010_add_n8n_integration.sql
-- Add n8n instance integration for Pro and Growth plans

-- =====================================================
-- N8N INSTANCE CONNECTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.n8n_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_name TEXT NOT NULL,
  instance_url TEXT NOT NULL,
  api_key TEXT NOT NULL, -- Encrypted in production
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  last_test_success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_connection_name UNIQUE (user_id, connection_name)
);

-- Index for quick user lookups
CREATE INDEX idx_n8n_connections_user_id ON public.n8n_connections(user_id);

-- RLS Policies
ALTER TABLE public.n8n_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections"
  ON public.n8n_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections"
  ON public.n8n_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
  ON public.n8n_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
  ON public.n8n_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all connections"
  ON public.n8n_connections FOR SELECT
  USING (is_user_admin(auth.uid()));

-- =====================================================
-- PUSHED WORKFLOWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pushed_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.n8n_connections(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  workflow_id TEXT, -- n8n workflow ID (returned after push)
  workflow_json JSONB NOT NULL,
  push_status TEXT DEFAULT 'pending' CHECK (push_status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  pushed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Monitoring data (Growth plan only)
  last_execution_time TIMESTAMPTZ,
  last_execution_status TEXT,
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  last_monitored_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pushed_workflows_user_id ON public.pushed_workflows(user_id);
CREATE INDEX idx_pushed_workflows_connection_id ON public.pushed_workflows(connection_id);
CREATE INDEX idx_pushed_workflows_workflow_id ON public.pushed_workflows(workflow_id);

-- RLS Policies
ALTER TABLE public.pushed_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pushed workflows"
  ON public.pushed_workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pushed workflows"
  ON public.pushed_workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pushed workflows"
  ON public.pushed_workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pushed workflows"
  ON public.pushed_workflows FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pushed workflows"
  ON public.pushed_workflows FOR SELECT
  USING (is_user_admin(auth.uid()));

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER set_updated_at_n8n_connections
  BEFORE UPDATE ON public.n8n_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_pushed_workflows
  BEFORE UPDATE ON public.pushed_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('n8n_connections', 'pushed_workflows')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
