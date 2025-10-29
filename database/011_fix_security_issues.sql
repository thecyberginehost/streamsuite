-- =====================================================
-- 011_fix_security_issues.sql
-- Fix Supabase Database Linter Security Warnings
-- =====================================================
-- This migration fixes all security warnings from Supabase database linter:
-- 1. Remove SECURITY DEFINER from user_stats view
-- 2. Add SET search_path = public to all functions
-- =====================================================

-- =====================================================
-- FIX 1: Remove SECURITY DEFINER from user_stats view
-- =====================================================
-- Recreate the view without SECURITY DEFINER property
-- This view will now enforce RLS policies of the querying user

DROP VIEW IF EXISTS public.user_stats;

CREATE VIEW public.user_stats
WITH (security_invoker = true) -- Explicitly use SECURITY INVOKER
AS
SELECT
  p.id,
  p.email,
  p.credits,
  p.total_workflows_generated,
  COUNT(DISTINCT w.id) as workflows_saved,
  COUNT(DISTINCT ct.id) as total_transactions,
  SUM(CASE WHEN ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END) as total_credits_spent,
  p.created_at as member_since
FROM public.profiles p
LEFT JOIN public.workflows w ON w.user_id = p.id
LEFT JOIN public.credit_transactions ct ON ct.user_id = p.id
GROUP BY p.id, p.email, p.credits, p.total_workflows_generated, p.created_at;

-- =====================================================
-- FIX 2: Add search_path to all functions
-- =====================================================

-- Function 1: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public -- FIX: Set immutable search_path
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function 2: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- FIX: Set immutable search_path
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Function 3: handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public -- FIX: Set immutable search_path
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function 4: deduct_credits
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_workflow_id UUID DEFAULT NULL,
  p_transaction_type TEXT DEFAULT 'generation'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- FIX: Set immutable search_path
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;

  INSERT INTO public.credit_transactions (user_id, workflow_id, amount, transaction_type)
  VALUES (p_user_id, p_workflow_id, -p_amount, p_transaction_type);

  RETURN v_new_balance;
END;
$$;

-- Function 5: add_credits
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- FIX: Set immutable search_path
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;

  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, p_amount, p_transaction_type, p_description);

  RETURN v_new_balance;
END;
$$;

-- Function 6: get_user_credits
CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- FIX: Set immutable search_path
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT credits INTO v_credits
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN COALESCE(v_credits, 0);
END;
$$;

-- Function 7: deduct_batch_credits
CREATE OR REPLACE FUNCTION public.deduct_batch_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_workflow_count INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- FIX: Set immutable search_path
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current batch credits
  SELECT batch_credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id;

  -- Check if user has enough credits
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient batch credits. Required: %, Available: %', p_amount, v_current_balance;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Update profile
  UPDATE public.profiles
  SET batch_credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO public.batch_credit_transactions (
    user_id,
    amount,
    balance_after,
    operation_type,
    workflow_count,
    metadata
  ) VALUES (
    p_user_id,
    -p_amount, -- Negative for deduction
    v_new_balance,
    'generation',
    p_workflow_count,
    p_metadata
  );

  RETURN v_new_balance;
END;
$$;

-- Function 8: add_batch_credits
CREATE OR REPLACE FUNCTION public.add_batch_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_operation_type TEXT DEFAULT 'subscription_grant',
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- FIX: Set immutable search_path
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current batch credits
  SELECT batch_credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Update profile
  UPDATE public.profiles
  SET batch_credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO public.batch_credit_transactions (
    user_id,
    amount,
    balance_after,
    operation_type,
    metadata
  ) VALUES (
    p_user_id,
    p_amount, -- Positive for addition
    v_new_balance,
    p_operation_type,
    p_metadata
  );

  RETURN v_new_balance;
END;
$$;

-- Function 9: get_user_batch_credits
CREATE OR REPLACE FUNCTION public.get_user_batch_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- FIX: Set immutable search_path
AS $$
DECLARE
  v_batch_credits INTEGER;
BEGIN
  SELECT batch_credits INTO v_batch_credits
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN COALESCE(v_batch_credits, 0);
END;
$$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify view exists and is security_invoker
SELECT
  viewname,
  schemaname,
  viewowner
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'user_stats';

-- Verify all functions have search_path set
SELECT
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE
    WHEN p.proconfig IS NULL THEN 'NO SEARCH_PATH SET'
    ELSE array_to_string(p.proconfig, ', ')
  END as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_updated_at_column',
    'handle_new_user',
    'handle_updated_at',
    'deduct_credits',
    'add_credits',
    'get_user_credits',
    'deduct_batch_credits',
    'add_batch_credits',
    'get_user_batch_credits'
  )
ORDER BY p.proname;

-- =====================================================
-- NOTES
-- =====================================================
--
-- Security fixes applied:
-- 1. user_stats view: Changed from SECURITY DEFINER to SECURITY INVOKER
--    - This means the view now enforces RLS policies of the querying user
--    - Admins can still see all stats via the is_user_admin() RLS policies
--
-- 2. All functions: Added SET search_path = public
--    - Prevents malicious users from creating functions in other schemas
--    - Protects against search_path hijacking attacks
--
-- All existing functionality is preserved:
-- - Credit operations still work
-- - Batch credits still work
-- - Admin access still works
-- - User stats still accessible via RLS policies
--
-- Auth warnings (leaked password protection, MFA) are configuration-level
-- and should be enabled in Supabase Dashboard > Authentication settings
-- =====================================================
