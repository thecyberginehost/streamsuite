-- Client Enhancements
-- Add logo, website, and additional fields for professional client management

-- Add new fields to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS primary_contact_name TEXT,
ADD COLUMN IF NOT EXISTS primary_contact_email TEXT;

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- Update client_workflow_analytics view to include more useful data
DROP VIEW IF EXISTS public.client_workflow_analytics;
CREATE OR REPLACE VIEW public.client_workflow_analytics AS
SELECT
  c.id as client_id,
  c.name as client_name,
  c.company as client_company,
  c.logo_url as client_logo,
  c.status as client_status,
  COUNT(DISTINCT w.id) as total_workflows,
  COUNT(DISTINCT cpc.id) as total_connections,
  COUNT(DISTINCT CASE WHEN cpc.platform = 'n8n' THEN cpc.id END) as n8n_connections,
  COUNT(DISTINCT CASE WHEN cpc.platform = 'make' THEN cpc.id END) as make_connections,
  COUNT(DISTINCT CASE WHEN cpc.platform = 'zapier' THEN cpc.id END) as zapier_connections,
  -- These would be populated when we integrate with n8n execution monitoring
  0 as failed_executions_24h,
  0 as total_executions_7d,
  0.0 as success_rate,
  MAX(w.created_at) as last_workflow_created,
  c.created_at as client_since,
  c.updated_at as last_updated
FROM public.clients c
LEFT JOIN public.client_platform_connections cpc ON c.id = cpc.client_id AND cpc.is_active = true
LEFT JOIN public.workflows w ON c.id = w.client_id
WHERE c.agency_id = auth.uid()
GROUP BY c.id, c.name, c.company, c.logo_url, c.status, c.created_at, c.updated_at;

-- Grant access to the view
GRANT SELECT ON public.client_workflow_analytics TO authenticated;
