-- Add zapier_instance_url field to client_platform_connections
-- This allows agencies to store a client-specific Zapier workspace URL

ALTER TABLE public.client_platform_connections
ADD COLUMN IF NOT EXISTS zapier_instance_url TEXT;

-- Update the check constraint to make zapier_api_key optional (since API has limited use)
-- and remove the requirement for zapier_api_key
ALTER TABLE public.client_platform_connections
DROP CONSTRAINT IF EXISTS check_platform_credentials;

ALTER TABLE public.client_platform_connections
ADD CONSTRAINT check_platform_credentials CHECK (
  (platform = 'n8n' AND n8n_instance_url IS NOT NULL AND n8n_api_key IS NOT NULL) OR
  (platform = 'make' AND make_api_key IS NOT NULL) OR
  (platform = 'zapier')  -- Zapier only needs connection_name, rest is optional
);

-- Add comment explaining the zapier_instance_url field
COMMENT ON COLUMN public.client_platform_connections.zapier_instance_url IS
  'Client-specific Zapier workspace URL (e.g., https://zapier.com/app/home?conversationId=xxx). Used to open the correct Zapier workspace in the embedded browser.';

COMMENT ON COLUMN public.client_platform_connections.zapier_api_key IS
  'Optional Zapier API key (limited functionality - mainly for Developer Platform). Not required since Zapier does not provide a workflow management API.';
