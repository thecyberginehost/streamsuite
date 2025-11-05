-- Add make_instance_url field to client_platform_connections
-- This allows agencies to embed Make.com workspace in iframe for client workflow management

ALTER TABLE public.client_platform_connections
ADD COLUMN IF NOT EXISTS make_instance_url TEXT;

-- Add comment explaining the make_instance_url field
COMMENT ON COLUMN public.client_platform_connections.make_instance_url IS
  'Client-specific Make.com workspace URL (e.g., https://us1.make.com/organization/123/scenarios). Used to open the correct Make.com workspace in the embedded iframe for direct workflow management.';
