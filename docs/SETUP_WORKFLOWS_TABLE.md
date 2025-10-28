# Setup Workflows Table - Quick Guide

## Problem

When you click **"Save to History"**, you get an error because the `workflows` table doesn't exist in your Supabase database.

## Solution

Run the SQL migration to create the table. Takes 2 minutes!

---

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### 2. Copy the SQL

Open the file [supabase_workflows_table.sql](supabase_workflows_table.sql) and copy ALL the contents.

Or copy this:

```sql
-- Create workflows table for StreamSuite
-- Run this in your Supabase SQL Editor to enable workflow history

CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('n8n', 'make', 'zapier')),
  workflow_json JSONB NOT NULL,
  prompt TEXT,
  template_used TEXT,
  credits_used INTEGER DEFAULT 1,
  tokens_used INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS workflows_user_id_idx ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS workflows_created_at_idx ON public.workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS workflows_platform_idx ON public.workflows(platform);

-- Enable Row Level Security
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workflows"
  ON public.workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflows"
  ON public.workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
  ON public.workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
  ON public.workflows FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.workflows TO authenticated;
GRANT ALL ON public.workflows TO service_role;
```

### 3. Paste and Run

1. Paste the SQL into the editor
2. Click **"Run"** button (or press Ctrl+Enter)
3. Wait ~2 seconds
4. You should see: **"Success. No rows returned"**

### 4. Verify It Worked

1. Click **"Table Editor"** in left sidebar
2. Look for **"workflows"** table in the list
3. Click on it
4. You should see these columns:
   - id
   - user_id
   - name
   - platform
   - workflow_json
   - created_at
   - etc.

If you see the table, you're done! ✅

---

## Test Save to History

1. Go back to your StreamSuite app
2. Generate a workflow
3. Click **"Save"** button (top-right)
4. Should see: **"✅ Saved to history!"**
5. Go to History page
6. Your workflow should be there!

---

## Troubleshooting

### Error: "relation already exists"

**Meaning**: Table already exists (that's good!)

**Solution**: Nothing to do, it's already set up.

---

### Error: "permission denied"

**Meaning**: Your database user doesn't have permissions

**Solution**:
1. Make sure you're signed in as the project owner
2. Or ask the owner to run the SQL

---

### Error: "could not find the table 'workflows'"

**Meaning**: SQL didn't run or failed

**Solution**:
1. Check for error messages in SQL Editor
2. Make sure you clicked "Run"
3. Try running the SQL again
4. Refresh the page

---

### Save still fails after creating table

**Check these**:
1. Is the `workflows` table in your database? (Table Editor)
2. Are you signed in to the app?
3. Check browser console for errors (F12)
4. Try generating a simple workflow first

**Common issue**: RLS policies

If you see "new row violates row-level security policy", run:

```sql
-- Temporarily disable RLS for testing
ALTER TABLE public.workflows DISABLE ROW LEVEL SECURITY;
```

This removes security (not recommended for production!) but lets you test if that's the issue.

---

## What This SQL Does

### Creates Table
- Stores workflow data (name, JSON, platform, etc.)
- Links to user accounts (user_id)
- Tracks metadata (tokens, credits, timestamps)

### Security (RLS)
- Users can only see their own workflows
- Users can only modify their own workflows
- Other users can't access your data

### Performance
- Indexes on user_id, created_at, platform
- Fast queries even with thousands of workflows

### Auto-Updates
- `updated_at` automatically updates when you edit
- `created_at` set once when workflow is saved

---

## Schema Reference

```typescript
interface Workflow {
  id: string;                    // UUID, auto-generated
  user_id: string;               // Links to auth.users
  name: string;                  // "Sales Pipeline Automation"
  description?: string;          // First 200 chars of prompt
  platform: 'n8n' | 'make' | 'zapier';
  workflow_json: any;            // Full workflow JSON
  prompt?: string;               // Original user prompt
  template_used?: string;        // Template ID if used
  credits_used: number;          // Default: 1
  tokens_used: number;           // From AI generation
  is_favorite: boolean;          // Star it!
  tags: string[];                // ["automation", "sales"]
  status: 'success' | 'failed' | 'pending';
  error_message?: string;        // If generation failed
  created_at: string;            // ISO timestamp
  updated_at: string;            // Auto-updates
}
```

---

## Quick Commands

### View all workflows:
```sql
SELECT * FROM public.workflows ORDER BY created_at DESC;
```

### Count workflows per user:
```sql
SELECT user_id, COUNT(*) as total
FROM public.workflows
GROUP BY user_id;
```

### Delete all workflows (careful!):
```sql
DELETE FROM public.workflows;
```

### Drop table (if you need to start over):
```sql
DROP TABLE IF EXISTS public.workflows CASCADE;
```

---

## Summary

1. **Copy SQL** from supabase_workflows_table.sql
2. **Run in Supabase** SQL Editor
3. **Verify** table exists in Table Editor
4. **Test** save to history in app
5. **Done!** ✅

Takes 2 minutes, enables full workflow history tracking!
