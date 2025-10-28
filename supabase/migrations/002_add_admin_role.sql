-- =====================================================
-- StreamSuite Admin Role Support
-- =====================================================
-- This migration adds admin role support for user management

-- Add is_admin column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN profiles.is_admin IS 'Whether user has admin privileges for user management';

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Initialize all existing users as non-admin
UPDATE profiles
SET is_admin = false
WHERE is_admin IS NULL;

-- =====================================================
-- Manual step: Set your admin user
-- =====================================================
-- After running this migration, manually set your admin user:
-- UPDATE profiles SET is_admin = true WHERE email = 'your-admin-email@example.com';

-- =====================================================
-- Rollback instructions
-- =====================================================
-- To rollback this migration:
/*
DROP INDEX IF EXISTS idx_profiles_is_admin;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;
*/
