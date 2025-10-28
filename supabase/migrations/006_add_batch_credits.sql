-- =====================================================
-- StreamSuite - Add Batch Credits Tracking
-- =====================================================
-- This migration adds batch credits tracking to support
-- the batch workflow generation feature.
-- =====================================================

-- 1. Add batch_credits column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS batch_credits INTEGER DEFAULT 0;

-- 2. Create batch_credit_transactions table
CREATE TABLE IF NOT EXISTS public.batch_credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- Negative for deductions, positive for additions
  balance_after INTEGER NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('generation', 'subscription_grant', 'admin_adjustment', 'rollover')),
  workflow_count INTEGER, -- Number of workflows generated (if operation_type = 'generation')
  metadata JSONB, -- Additional data (plan name, admin notes, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.batch_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for batch_credit_transactions
CREATE POLICY "Users can view their own batch credit transactions"
  ON public.batch_credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_batch_credit_transactions_user_id
  ON public.batch_credit_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_batch_credit_transactions_created_at
  ON public.batch_credit_transactions(created_at DESC);

-- 3. Create function to deduct batch credits
CREATE OR REPLACE FUNCTION public.deduct_batch_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_workflow_count INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 4. Create function to add batch credits
CREATE OR REPLACE FUNCTION public.add_batch_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_operation_type TEXT DEFAULT 'subscription_grant',
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 5. Create function to get user batch credits
CREATE OR REPLACE FUNCTION public.get_user_batch_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 6. Grant initial batch credits to existing users based on subscription tier
-- This will grant batch credits to users who already have Growth or Agency tiers

-- Growth tier gets 50 batch credits
UPDATE public.profiles
SET batch_credits = 50
WHERE subscription_tier = 'growth' AND batch_credits = 0;

-- Agency tier gets 200 batch credits
UPDATE public.profiles
SET batch_credits = 200
WHERE subscription_tier = 'agency' AND batch_credits = 0;

-- Record these initial grants as transactions
INSERT INTO public.batch_credit_transactions (user_id, amount, balance_after, operation_type, metadata)
SELECT
  id,
  CASE
    WHEN subscription_tier = 'growth' THEN 50
    WHEN subscription_tier = 'agency' THEN 200
    ELSE 0
  END,
  CASE
    WHEN subscription_tier = 'growth' THEN 50
    WHEN subscription_tier = 'agency' THEN 200
    ELSE 0
  END,
  'subscription_grant',
  jsonb_build_object('reason', 'Initial batch credits grant', 'tier', subscription_tier)
FROM public.profiles
WHERE subscription_tier IN ('growth', 'agency') AND batch_credits > 0;

-- =====================================================
-- DONE! Batch credits are now tracked in the database
-- =====================================================

COMMENT ON COLUMN public.profiles.batch_credits IS 'Current batch credits balance for batch workflow generation';
COMMENT ON TABLE public.batch_credit_transactions IS 'Tracks all batch credit additions and deductions';
COMMENT ON FUNCTION public.deduct_batch_credits IS 'Deducts batch credits from user account and records transaction';
COMMENT ON FUNCTION public.add_batch_credits IS 'Adds batch credits to user account and records transaction';
COMMENT ON FUNCTION public.get_user_batch_credits IS 'Returns current batch credits balance for a user';
