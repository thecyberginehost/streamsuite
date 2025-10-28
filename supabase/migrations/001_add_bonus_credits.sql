-- =====================================================
-- StreamSuite Bonus Credits & Credit System v2.0
-- =====================================================
-- This migration adds support for:
-- 1. Bonus credits (never expire)
-- 2. User preference for credit usage order
-- 3. Credit purchases table
-- 4. Onboarding progress tracking

-- Add bonus_credits column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bonus_credits INTEGER DEFAULT 0 CHECK (bonus_credits >= 0);

-- Add use_bonus_first preference to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS use_bonus_first BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN profiles.bonus_credits IS 'Bonus credits purchased or earned - never expire';
COMMENT ON COLUMN profiles.use_bonus_first IS 'User preference: use bonus credits before regular credits';

-- Create credit_purchases table (track top-ups and bonus credit purchases)
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('starter', 'standard', 'plus', 'bulk')),
  credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
  amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid > 0),
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created_at ON credit_purchases(created_at DESC);

-- Add comment
COMMENT ON TABLE credit_purchases IS 'Tracks one-time credit top-up purchases';

-- Create onboarding_progress table (track onboarding for bonus credit rewards)
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  completed BOOLEAN DEFAULT false,
  steps_completed JSONB DEFAULT '{}',
  bonus_credits_awarded INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON onboarding_progress(user_id);

-- Add comment
COMMENT ON TABLE onboarding_progress IS 'Tracks user onboarding progress and bonus credit rewards';

-- Update credit_transactions table to track regular vs bonus (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_transactions') THEN
    ALTER TABLE credit_transactions
    ADD COLUMN IF NOT EXISTS credit_type VARCHAR(20) DEFAULT 'regular' CHECK (credit_type IN ('regular', 'bonus'));

    COMMENT ON COLUMN credit_transactions.credit_type IS 'Type of credit used: regular (subscription) or bonus (purchased/earned)';
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for onboarding_progress
DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
    BEFORE UPDATE ON onboarding_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust based on your RLS policies)
-- These are example grants - adjust based on your security model

-- Allow authenticated users to read their own data
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own credit purchases
CREATE POLICY "Users can view own credit purchases" ON credit_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can read their own onboarding progress
CREATE POLICY "Users can view own onboarding" ON onboarding_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own onboarding progress
CREATE POLICY "Users can update own onboarding" ON onboarding_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can insert their own onboarding record
CREATE POLICY "Users can create own onboarding" ON onboarding_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Initialize bonus_credits for existing users
UPDATE profiles
SET bonus_credits = 0
WHERE bonus_credits IS NULL;

-- Initialize use_bonus_first for existing users
UPDATE profiles
SET use_bonus_first = false
WHERE use_bonus_first IS NULL;

-- =====================================================
-- Sample data for testing (REMOVE IN PRODUCTION)
-- =====================================================

-- Uncomment below to add test bonus credits to a specific user
-- UPDATE profiles
-- SET bonus_credits = 50
-- WHERE email = 'your-test-email@example.com';

-- =====================================================
-- Rollback instructions
-- =====================================================

-- To rollback this migration:
/*
DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS onboarding_progress CASCADE;
DROP TABLE IF NOT EXISTS credit_purchases CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS use_bonus_first;
ALTER TABLE profiles DROP COLUMN IF EXISTS bonus_credits;
ALTER TABLE credit_transactions DROP COLUMN IF EXISTS credit_type;
*/
