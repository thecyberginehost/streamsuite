# Database Migration Required: n8n Integration Tables

## Problem
You're seeing "no workflows pushed yet" when clicking "View Workflows" because the `n8n_connections` and `pushed_workflows` tables don't exist in your Supabase database yet.

## Solution
Run migration `007_add_n8n_integration.sql` to create the required tables.

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/007_add_n8n_integration.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`
7. Verify success: You should see "Success. No rows returned"

### Option 2: Supabase CLI (If Linked)
```bash
# Link your project (one-time setup)
npx supabase link --project-ref your-project-ref

# Push migration
npx supabase db push
```

## What This Migration Creates

### Tables:
1. **`n8n_connections`** - Stores user's n8n instance connections
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to auth.users)
   - `connection_name` (TEXT)
   - `instance_url` (TEXT)
   - `api_key` (TEXT, encrypted)
   - `is_active` (BOOLEAN)
   - `last_tested_at` (TIMESTAMP)
   - `last_test_success` (BOOLEAN)
   - `created_at`, `updated_at` (TIMESTAMP)

2. **`pushed_workflows`** - Tracks workflows pushed to n8n
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to auth.users)
   - `connection_id` (UUID, foreign key to n8n_connections)
   - `workflow_name` (TEXT)
   - `workflow_id` (TEXT, n8n's internal workflow ID)
   - `workflow_json` (JSONB)
   - `push_status` (TEXT: 'success' or 'failed')
   - `error_message` (TEXT)
   - `pushed_at` (TIMESTAMP)
   - Execution stats: `total_executions`, `successful_executions`, `failed_executions`, `last_execution_at`

### Security:
- Row Level Security (RLS) enabled on both tables
- Users can only access their own connections and workflows
- 4 policies per table: SELECT, INSERT, UPDATE, DELETE

### Indexes:
- Fast lookups by `user_id`, `connection_id`, `push_status`
- Optimized sorting by `pushed_at` DESC

## After Migration
1. Refresh your browser
2. Try pushing a workflow again - it should now save to the database
3. Click "View Workflows" - you should see your pushed workflows listed
4. Growth plan users can click "View Executions" to monitor workflow runs

## Verification
Run this query in Supabase SQL Editor to verify tables exist:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('n8n_connections', 'pushed_workflows');
```

You should see 2 rows returned.

## Need Help?
If you encounter errors:
1. Check that your Supabase project is active
2. Verify you have admin/owner permissions on the project
3. Look for error messages in the SQL Editor output
4. Check the Supabase logs for RLS policy errors
