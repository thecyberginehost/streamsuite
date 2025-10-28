# Fix: Save to History Not Working

## Error Message

```
Could not find the 'credits_used' column of 'workflows' in the schema cache
```

## Problem

Your `workflows` table exists but is **missing required columns**. This happens if:
1. The table was created with an older schema
2. The SQL migration wasn't fully executed
3. Columns were accidentally dropped

## Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to [https://supabase.com](https://supabase.com)
2. Open your project
3. Click **"SQL Editor"** in sidebar
4. Click **"New Query"**

### Step 2: Run the Fix SQL

Copy and paste this entire SQL script:

```sql
-- Fix workflows table - Add missing columns
-- Run this if you're getting "could not find column" errors

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
```

Or use the file: [supabase_fix_workflows_table.sql](../database/supabase_fix_workflows_table.sql)

### Step 3: Click Run

1. Click **"Run"** button (or Ctrl+Enter)
2. Wait ~2 seconds
3. Check output - should see "Added X column" messages

### Step 4: Verify

At the bottom, you'll see a table showing all columns. Should include:
- ✅ id
- ✅ user_id
- ✅ name
- ✅ description
- ✅ platform
- ✅ workflow_json
- ✅ prompt
- ✅ template_used
- ✅ **credits_used** ← Should be there now!
- ✅ **tokens_used** ← Should be there now!
- ✅ is_favorite
- ✅ tags
- ✅ status
- ✅ error_message
- ✅ created_at
- ✅ updated_at

### Step 5: Test Save

1. Go back to StreamSuite
2. Generate a workflow
3. Click **"Save"** button
4. Should see: **"✅ Saved to history!"**
5. Go to History page
6. Your workflow should be there!

---

## Alternative: Start Fresh (if needed)

If you want to completely recreate the table with all columns:

### ⚠️ WARNING: This deletes all saved workflows!

```sql
-- Drop and recreate table (deletes all data!)
DROP TABLE IF EXISTS public.workflows CASCADE;

-- Then run the full SQL from supabase_workflows_table.sql
```

---

## Troubleshooting

### Still getting column errors?

**Check which column is missing:**
```
Error: "Could not find the 'X' column"
```

**Manually add that column:**
```sql
ALTER TABLE public.workflows ADD COLUMN credits_used INTEGER DEFAULT 1;
ALTER TABLE public.workflows ADD COLUMN tokens_used INTEGER DEFAULT 0;
-- etc.
```

### Error: "column already exists"

That's fine! The script checks and skips existing columns.

### Error: "relation does not exist"

The table doesn't exist at all. Run the full creation script from:
[supabase_workflows_table.sql](../database/supabase_workflows_table.sql)

### Save still fails after adding columns

1. **Check browser console** (F12) for specific error
2. **Refresh Supabase schema cache**:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
3. **Check RLS policies** - Make sure they exist (the fix script doesn't add them)
4. **Verify you're logged in** - Can't save if not authenticated

---

## What Each Column Does

| Column | Type | Purpose |
|--------|------|---------|
| credits_used | INTEGER | How many credits this generation cost |
| tokens_used | INTEGER | AI tokens used for generation |
| is_favorite | BOOLEAN | Star/favorite for quick access |
| tags | TEXT[] | User-defined tags for organization |
| status | TEXT | success/failed/pending |
| error_message | TEXT | Error details if generation failed |
| prompt | TEXT | Original user prompt |
| template_used | TEXT | Template ID if used |

---

## Summary

1. ✅ Copy the SQL from above
2. ✅ Paste in Supabase SQL Editor
3. ✅ Click Run
4. ✅ Check output shows columns added
5. ✅ Test save in app
6. ✅ Done!

Takes 2 minutes. Your Save to History will work after this! 🎉
