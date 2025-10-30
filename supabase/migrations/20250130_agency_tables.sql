-- Agency Dashboard Tables
-- Tables for client management and programmatic API access

-- Clients Table
-- Agencies can create clients to organize their work
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- API Keys Table
-- For programmatic access to workflow generation
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- Store hashed API key
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "sk_live_abc123...")
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '["workflow_generation"]'::jsonb,
  rate_limit_per_minute INTEGER DEFAULT 10,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Client Projects Table
-- Link workflows to specific clients
CREATE TABLE IF NOT EXISTS public.client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'archived')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add client_id to workflows table
ALTER TABLE public.workflows
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.client_projects(id) ON DELETE SET NULL;

-- Add client_id to workflow_sets table
ALTER TABLE public.workflow_sets
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.client_projects(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON public.clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_client_projects_client_id ON public.client_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_status ON public.client_projects(status);

CREATE INDEX IF NOT EXISTS idx_workflows_client_id ON public.workflows(client_id);
CREATE INDEX IF NOT EXISTS idx_workflows_project_id ON public.workflows(project_id);

CREATE INDEX IF NOT EXISTS idx_workflow_sets_client_id ON public.workflow_sets(client_id);
CREATE INDEX IF NOT EXISTS idx_workflow_sets_project_id ON public.workflow_sets(project_id);

-- RLS Policies

-- Clients: Users can only see their own clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = agency_id);

CREATE POLICY "Users can create their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = agency_id);

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = agency_id);

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = agency_id);

-- API Keys: Users can only see their own API keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Client Projects: Users can only see projects for their clients
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client projects"
  ON public.client_projects FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects for their clients"
  ON public.client_projects FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their client projects"
  ON public.client_projects FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their client projects"
  ON public.client_projects FOR DELETE
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = auth.uid()
    )
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_projects_updated_at ON public.client_projects;
CREATE TRIGGER update_client_projects_updated_at
  BEFORE UPDATE ON public.client_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
