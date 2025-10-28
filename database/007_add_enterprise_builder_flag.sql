-- Add Enterprise Builder Feature Flag
-- Run this in Supabase SQL Editor

-- Insert the enterprise_builder feature flag (disabled by default)
INSERT INTO public.feature_flags (flag_key, flag_name, description, is_enabled)
VALUES (
  'enterprise_builder',
  'Enterprise Builder',
  'Enable the Enterprise Workflow Builder for complex workflows (20-100+ nodes). When disabled, only admins can access it for development.',
  false
)
ON CONFLICT (flag_key) DO UPDATE
SET
  flag_name = EXCLUDED.flag_name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify the flag was created
SELECT * FROM public.feature_flags WHERE flag_key = 'enterprise_builder';
