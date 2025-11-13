-- =====================================================
-- Migration 018: Enforce n8n Connection Limits by Subscription Tier
-- =====================================================
-- This migration adds database-level enforcement for n8n connection limits:
-- - Free/Starter: 0 connections (no n8n access)
-- - Pro: 1 connection max
-- - Growth: 3 connections max
-- - Agency: Unlimited connections
-- =====================================================

-- =====================================================
-- STEP 1: Create function to get max connections for tier
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_max_n8n_connections(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE tier
    WHEN 'free' THEN RETURN 0;
    WHEN 'starter' THEN RETURN 0;
    WHEN 'pro' THEN RETURN 1;
    WHEN 'growth' THEN RETURN 3;
    WHEN 'agency' THEN RETURN -1; -- -1 means unlimited
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- STEP 2: Create function to check if user can add connection
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_add_n8n_connection()
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  current_connections INTEGER;
  max_connections INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM public.profiles
  WHERE id = auth.uid();

  -- If no profile found, deny
  IF user_tier IS NULL THEN
    RETURN false;
  END IF;

  -- Get max connections for tier
  max_connections := get_max_n8n_connections(user_tier);

  -- If tier doesn't allow n8n connections
  IF max_connections = 0 THEN
    RETURN false;
  END IF;

  -- If unlimited (Agency)
  IF max_connections = -1 THEN
    RETURN true;
  END IF;

  -- Count current connections
  SELECT COUNT(*) INTO current_connections
  FROM public.n8n_connections
  WHERE user_id = auth.uid();

  -- Check if under limit
  RETURN current_connections < max_connections;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- STEP 3: Update INSERT policy to enforce connection limits
-- =====================================================

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert their own connections" ON public.n8n_connections;

-- Create new policy with connection limit check
CREATE POLICY "Users can insert their own connections with tier limits"
  ON public.n8n_connections FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND can_add_n8n_connection()
  );

-- =====================================================
-- STEP 4: Add helpful error messages via constraint
-- =====================================================

-- Create a trigger function to provide better error messages
CREATE OR REPLACE FUNCTION public.check_n8n_connection_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_tier TEXT;
  current_connections INTEGER;
  max_connections INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Get max connections
  max_connections := get_max_n8n_connections(user_tier);

  -- Check if tier allows n8n connections
  IF max_connections = 0 THEN
    RAISE EXCEPTION 'Your % plan does not include n8n connections. Upgrade to Pro or higher.', user_tier
      USING HINT = 'Upgrade to Pro ($49/mo) for 1 connection, or Growth ($99/mo) for 3 connections.';
  END IF;

  -- If unlimited, allow
  IF max_connections = -1 THEN
    RETURN NEW;
  END IF;

  -- Count current connections
  SELECT COUNT(*) INTO current_connections
  FROM public.n8n_connections
  WHERE user_id = NEW.user_id;

  -- Check limit
  IF current_connections >= max_connections THEN
    RAISE EXCEPTION 'Connection limit reached. Your % plan allows % connection(s). You currently have %.',
      user_tier, max_connections, current_connections
      USING HINT = CASE
        WHEN user_tier = 'pro' THEN 'Upgrade to Growth ($99/mo) for 3 connections, or Agency ($499/mo) for unlimited.'
        WHEN user_tier = 'growth' THEN 'Upgrade to Agency ($499/mo) for unlimited connections.'
        ELSE 'Please upgrade your plan to add more connections.'
      END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert
DROP TRIGGER IF EXISTS enforce_n8n_connection_limit ON public.n8n_connections;
CREATE TRIGGER enforce_n8n_connection_limit
  BEFORE INSERT ON public.n8n_connections
  FOR EACH ROW
  EXECUTE FUNCTION check_n8n_connection_limit();

-- =====================================================
-- STEP 5: Create view for connection limits per user
-- =====================================================

CREATE OR REPLACE VIEW public.user_n8n_connection_info AS
SELECT
  p.id AS user_id,
  p.subscription_tier,
  get_max_n8n_connections(p.subscription_tier) AS max_connections,
  COUNT(nc.id) AS current_connections,
  CASE
    WHEN get_max_n8n_connections(p.subscription_tier) = 0 THEN false
    WHEN get_max_n8n_connections(p.subscription_tier) = -1 THEN true
    ELSE COUNT(nc.id) < get_max_n8n_connections(p.subscription_tier)
  END AS can_add_connection
FROM public.profiles p
LEFT JOIN public.n8n_connections nc ON nc.user_id = p.id
WHERE p.id = auth.uid()
GROUP BY p.id, p.subscription_tier;

-- Grant access to authenticated users
GRANT SELECT ON public.user_n8n_connection_info TO authenticated;

-- =====================================================
-- STEP 6: Add indexes for performance
-- =====================================================

-- Index for counting connections by user (if not exists)
CREATE INDEX IF NOT EXISTS idx_n8n_connections_user_count
  ON public.n8n_connections(user_id)
  WHERE user_id IS NOT NULL;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
DECLARE
  free_max INTEGER;
  starter_max INTEGER;
  pro_max INTEGER;
  growth_max INTEGER;
  agency_max INTEGER;
BEGIN
  -- Test the function
  free_max := get_max_n8n_connections('free');
  starter_max := get_max_n8n_connections('starter');
  pro_max := get_max_n8n_connections('pro');
  growth_max := get_max_n8n_connections('growth');
  agency_max := get_max_n8n_connections('agency');

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration 018 completed successfully!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'n8n Connection Limits Enforced:';
  RAISE NOTICE '  Free: % connections', free_max;
  RAISE NOTICE '  Starter: % connections', starter_max;
  RAISE NOTICE '  Pro: % connection(s)', pro_max;
  RAISE NOTICE '  Growth: % connections', growth_max;
  RAISE NOTICE '  Agency: Unlimited (% = unlimited)', agency_max;
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Features Added:';
  RAISE NOTICE '  - get_max_n8n_connections(tier) function';
  RAISE NOTICE '  - can_add_n8n_connection() function';
  RAISE NOTICE '  - Connection limit enforcement trigger';
  RAISE NOTICE '  - user_n8n_connection_info view';
  RAISE NOTICE '  - Helpful error messages when limit reached';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Frontend Usage:';
  RAISE NOTICE '  SELECT * FROM user_n8n_connection_info;';
  RAISE NOTICE '  -- Returns: max_connections, current_connections, can_add_connection';
  RAISE NOTICE '==============================================';
END $$;
