-- Create workflows table for StreamSuite
-- Run this in your Supabase SQL Editor to enable workflow history

CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('n8n', 'make', 'zapier')),
  workflow_json JSONB NOT NULL,
  prompt TEXT,
  template_used TEXT,
  credits_used INTEGER DEFAULT 1,
  tokens_used INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS workflows_user_id_idx ON public.workflows(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS workflows_created_at_idx ON public.workflows(created_at DESC);

-- Create index on platform for filtering
CREATE INDEX IF NOT EXISTS workflows_platform_idx ON public.workflows(platform);

-- Enable Row Level Security
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own workflows
CREATE POLICY "Users can view their own workflows"
  ON public.workflows FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own workflows
CREATE POLICY "Users can insert their own workflows"
  ON public.workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own workflows
CREATE POLICY "Users can update their own workflows"
  ON public.workflows FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own workflows
CREATE POLICY "Users can delete their own workflows"
  ON public.workflows FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.workflows TO authenticated;
GRANT ALL ON public.workflows TO service_role;
