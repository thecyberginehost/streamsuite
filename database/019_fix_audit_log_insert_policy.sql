-- =====================================================
-- FIX AUDIT LOG INSERT POLICY
-- =====================================================
--
-- Issue: The current policy only allows service_role to insert audit logs.
-- The frontend uses the anon key with authenticated users, so we need
-- to allow authenticated users to insert their own audit logs.
--
-- Date: 2025-01-17
-- =====================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create new policy that allows authenticated users to insert their own logs
CREATE POLICY "Users can insert their own audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also allow service role for backend operations (webhooks, edge functions)
CREATE POLICY "Service role can insert any audit logs"
  ON public.audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Verify the policies
DO $$
BEGIN
  RAISE NOTICE 'Audit log insert policies updated successfully';
  RAISE NOTICE 'Users can now insert their own audit logs from the frontend';
END $$;
