# 🚨 DATABASE MIGRATION REQUIRED

## Problem

You're getting an error when trying to "Save to History" because your database is **missing two critical columns** that the application code expects:

1. `status` - Tracks if workflow is success/failed/pending
2. `error_message` - Stores debugging information

## Solution: Run This SQL Migration

### Option 1: Quick Fix (Run in Supabase SQL Editor)

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/tlxpfjjckmvotkdiabll
2. **Click "SQL Editor"** in left sidebar
3. **Click "New Query"**
4. **Copy and paste this SQL**:

```sql
-- Add status column to workflows table
ALTER TABLE public.workflows
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success'
CHECK (status IN ('success', 'failed', 'pending'));

-- Add error_message column
ALTER TABLE public.workflows
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);

-- Add documentation
COMMENT ON COLUMN public.workflows.status IS 'Workflow generation status: success (working), failed (not working), pending (not tested)';
COMMENT ON COLUMN public.workflows.error_message IS 'Error message if workflow failed or debugging information';
```

5. **Click "Run"** button
6. **Verify success** - You should see "Success. No rows returned"

### Option 2: Full Reset (If you want clean slate)

If you haven't added any important data yet and want to start fresh:

1. **Run the cleanup section** from SUPABASE_SETUP.sql (lines 272-285)
2. **Run the full SUPABASE_SETUP.sql** with the updated schema
3. **Note**: This will delete ALL your existing workflows and user data

## What Changed?

### Before (Old Schema):
```sql
CREATE TABLE public.workflows (
  id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  platform TEXT,
  workflow_json JSONB,
  prompt TEXT,
  template_used TEXT,
  credits_used INTEGER,
  tokens_used INTEGER,
  is_favorite BOOLEAN,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
  -- ❌ Missing: status and error_message
);
```

### After (New Schema):
```sql
CREATE TABLE public.workflows (
  id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  platform TEXT,
  workflow_json JSONB,
  prompt TEXT,
  template_used TEXT,
  credits_used INTEGER,
  tokens_used INTEGER,
  is_favorite BOOLEAN,
  tags TEXT[],
  status TEXT DEFAULT 'success',  -- ✅ ADDED
  error_message TEXT,              -- ✅ ADDED
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Why This Happened

The database setup guide (`SUPABASE_SETUP.sql`) was created before we added the History and Debugger features. Those features require tracking workflow success/failure status, which needs these new columns.

## Verification

After running the migration, test it:

1. **Start dev server**: `npm run dev`
2. **Generate a workflow** or load a template
3. **Click "Save to History"**
4. **Should see**: "Workflow saved! You can find it in your History page."
5. **Go to History page**: Should see your workflow with status buttons (✓/✗/⏱)

## Files Updated

- ✅ `src/services/workflowService.ts` - Already expects `status` and `error_message`
- ✅ `src/pages/History.tsx` - Already uses status tracking
- ✅ `src/pages/Debugger.tsx` - Already uses error_message field
- ✅ `src/pages/Generator.tsx` - Already sends status on save
- ❌ `SUPABASE_SETUP.sql` - Needs manual update (see below)
- ✅ `SUPABASE_SETUP_UPDATE.sql` - Already has the migration script

## For New Installations

If you're setting up a fresh database in the future, update `SUPABASE_SETUP.sql` line 48-63 to include these columns by default:

```sql
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT DEFAULT 'n8n' CHECK (platform IN ('n8n', 'make', 'zapier')),
  workflow_json JSONB NOT NULL,
  prompt TEXT,
  template_used TEXT,
  credits_used INTEGER DEFAULT 1,
  tokens_used INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),  -- ADD THIS
  error_message TEXT,  -- ADD THIS
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

And add the index on line 90:

```sql
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
```

## Need Help?

If you encounter any errors:

1. **Check Supabase logs**: Dashboard → Database → Logs
2. **Check browser console**: Press F12 → Console tab
3. **Verify columns exist**: Run this query in SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'workflows'
ORDER BY ordinal_position;
```

You should see `status` and `error_message` in the results.

---

**🎯 TL;DR**: Copy the SQL from "Option 1" above into your Supabase SQL Editor and click Run. Then try saving a workflow again.
