-- Client Platform Connections
-- Agencies can add n8n, Make.com, or Zapier credentials for each client

-- Client Platform Connections Table
CREATE TABLE IF NOT EXISTS public.client_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('n8n', 'make', 'zapier')),
  connection_name TEXT NOT NULL,

  -- n8n specific fields
  n8n_instance_url TEXT,
  n8n_api_key TEXT,

  -- Make.com specific fields
  make_api_key TEXT,
  make_team_id TEXT,

  -- Zapier specific fields
  zapier_api_key TEXT,

  -- Connection status
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  last_test_success BOOLEAN,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure at least one platform credential is provided
  CONSTRAINT check_platform_credentials CHECK (
    (platform = 'n8n' AND n8n_instance_url IS NOT NULL AND n8n_api_key IS NOT NULL) OR
    (platform = 'make' AND make_api_key IS NOT NULL) OR
    (platform = 'zapier' AND zapier_api_key IS NOT NULL)
  )
);

-- Add connection_id to workflows to track which client connection was used
ALTER TABLE public.workflows
ADD COLUMN IF NOT EXISTS client_connection_id UUID REFERENCES public.client_platform_connections(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_client_id ON public.client_platform_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_platform ON public.client_platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_is_active ON public.client_platform_connections(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflows_client_connection_id ON public.workflows(client_connection_id);

-- RLS Policies
ALTER TABLE public.client_platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view connections for their clients"
  ON public.client_platform_connections FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = auth.uid()
    )
  );

CREATE POLICY "Users can create connections for their clients"
  ON public.client_platform_connections FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = auth.uid()
    )
  );

CREATE POLICY "Users can update connections for their clients"
  ON public.client_platform_connections FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete connections for their clients"
  ON public.client_platform_connections FOR DELETE
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = auth.uid()
    )
  );

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_client_platform_connections_updated_at ON public.client_platform_connections;
CREATE TRIGGER update_client_platform_connections_updated_at
  BEFORE UPDATE ON public.client_platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Client Workflow Analytics View
-- Aggregates workflow execution data per client for the overview dashboard
CREATE OR REPLACE VIEW public.client_workflow_analytics AS
SELECT
  c.id as client_id,
  c.name as client_name,
  c.company as client_company,
  COUNT(DISTINCT w.id) as total_workflows,
  COUNT(DISTINCT cpc.id) as total_connections,
  -- These would be populated when we integrate with n8n execution monitoring
  0 as failed_executions_24h,
  0 as total_executions_7d,
  0.0 as success_rate,
  MAX(w.created_at) as last_workflow_created,
  c.created_at as client_since
FROM public.clients c
LEFT JOIN public.client_platform_connections cpc ON c.id = cpc.client_id AND cpc.is_active = true
LEFT JOIN public.workflows w ON c.id = w.client_id
WHERE c.agency_id = auth.uid()
GROUP BY c.id, c.name, c.company, c.created_at;

-- Grant access to the view
GRANT SELECT ON public.client_workflow_analytics TO authenticated;
