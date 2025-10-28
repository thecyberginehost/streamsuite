-- Fix workflows table - Add missing columns
-- Run this if you're getting "could not find column" errors

-- Check if table exists and add missing columns
DO $$
BEGIN
  -- Add credits_used column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'credits_used'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN credits_used INTEGER DEFAULT 1;
    RAISE NOTICE 'Added credits_used column';
  ELSE
    RAISE NOTICE 'credits_used column already exists';
  END IF;

  -- Add tokens_used column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'tokens_used'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN tokens_used INTEGER DEFAULT 0;
    RAISE NOTICE 'Added tokens_used column';
  ELSE
    RAISE NOTICE 'tokens_used column already exists';
  END IF;

  -- Add is_favorite column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_favorite column';
  ELSE
    RAISE NOTICE 'is_favorite column already exists';
  END IF;

  -- Add tags column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN tags TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added tags column';
  ELSE
    RAISE NOTICE 'tags column already exists';
  END IF;

  -- Add status column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN status TEXT DEFAULT 'success';
    ALTER TABLE public.workflows ADD CONSTRAINT workflows_status_check CHECK (status IN ('success', 'failed', 'pending'));
    RAISE NOTICE 'Added status column';
  ELSE
    RAISE NOTICE 'status column already exists';
  END IF;

  -- Add error_message column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'error_message'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN error_message TEXT;
    RAISE NOTICE 'Added error_message column';
  ELSE
    RAISE NOTICE 'error_message column already exists';
  END IF;

  -- Add prompt column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'prompt'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN prompt TEXT;
    RAISE NOTICE 'Added prompt column';
  ELSE
    RAISE NOTICE 'prompt column already exists';
  END IF;

  -- Add template_used column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflows'
    AND column_name = 'template_used'
  ) THEN
    ALTER TABLE public.workflows ADD COLUMN template_used TEXT;
    RAISE NOTICE 'Added template_used column';
  ELSE
    RAISE NOTICE 'template_used column already exists';
  END IF;

  RAISE NOTICE 'Workflow table fix complete!';
END $$;

-- Verify columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'workflows'
ORDER BY ordinal_position;
