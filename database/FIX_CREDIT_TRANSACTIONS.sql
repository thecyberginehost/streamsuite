-- =====================================================
-- Fix: Create credit_transactions table
-- =====================================================
-- Run this if credit_transactions table wasn't created
-- =====================================================

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('generation', 'conversion', 'debug', 'purchase', 'refund', 'bonus')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- Verify table was created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'credit_transactions';
