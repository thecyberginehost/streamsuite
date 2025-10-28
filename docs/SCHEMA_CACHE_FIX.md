# Fix: Schema Cache Not Refreshing

## The Problem

You ran the database setup script, the columns were added successfully, but you're still seeing:
```
"Could not find the table 'public.profiles' in the schema cache"
"Could not find the 'credits_used' column of 'workflows' in the schema cache"
```

This means Supabase's PostgREST API layer hasn't reloaded its schema cache.

---

## Solution 1: Restart Supabase Project (Most Reliable)

This forces a complete reload of the schema cache.

### Steps:

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project: **tlxpfjjckmvotkdiabll**

2. **Pause the Project**
   - Click "Settings" (gear icon) in left sidebar
   - Click "General"
   - Scroll to bottom
   - Click **"Pause project"** button
   - Confirm by clicking "I understand, pause this project"

3. **Wait 30 Seconds**
   - Let the project fully pause

4. **Resume the Project**
   - Click **"Restore project"** button
   - Wait ~2 minutes for it to fully start

5. **Test Your App**
   - Hard refresh browser (Ctrl+Shift+R)
   - Try generating and saving a workflow
   - Should work now!

---

## Solution 2: Run Schema Reload Command

If you don't want to restart the project, try this SQL command:

### Steps:

1. **Open Supabase SQL Editor**
2. **Run this SQL:**

```sql
-- Force reload schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Verify columns exist
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workflows'
AND column_name IN ('user_id', 'credits_used', 'tokens_used');
```

3. **Should return 3 rows** (user_id, credits_used, tokens_used)
4. **Hard refresh browser**
5. **Test saving a workflow**

---

## Solution 3: Use Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Restart PostgREST
supabase db reset --db-url "postgresql://postgres:[YOUR_PASSWORD]@db.tlxpfjjckmvotkdiabll.supabase.co:5432/postgres"
```

---

## Solution 4: Manual PostgREST Restart (SQL)

Force PostgREST to disconnect and reconnect:

```sql
-- Disconnect all PostgREST connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'authenticator';

-- Force reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```

---

## Verification

After trying any solution above, run this SQL to verify:

```sql
-- Check profiles table exists
SELECT 'profiles' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Check workflows table has required columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workflows'
AND column_name IN ('user_id', 'credits_used', 'tokens_used', 'status', 'prompt')
ORDER BY column_name;
```

Should show:
- profiles: 10 columns
- workflows: 5 rows (user_id, credits_used, tokens_used, status, prompt)

---

## Why Does This Happen?

Supabase uses **PostgREST** as an API layer between your app and PostgreSQL. PostgREST caches the database schema for performance. When you add columns via SQL, PostgreSQL knows about them immediately, but PostgREST doesn't until it reloads.

The `NOTIFY pgrst, 'reload schema'` command *should* trigger a reload, but sometimes it doesn't work due to:
- Connection pooling
- Multiple PostgREST instances
- Timing issues
- Supabase's auto-scaling

**The most reliable fix is restarting the project** (Solution 1).

---

## Expected Behavior After Fix

✅ No more "Could not find table 'public.profiles'" errors
✅ No more "Could not find column 'credits_used'" errors
✅ TopBar shows your email (no profile errors)
✅ Save workflow button works
✅ History page shows saved workflows

---

## Still Not Working?

If none of the above work:

1. **Check if columns actually exist:**
   ```sql
   \d public.workflows
   ```
   Or:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'workflows';
   ```

2. **If columns are missing**, the setup script didn't run properly. Try:
   - Running `COMPLETE_DATABASE_SETUP_FIXED.sql` again
   - Or manually adding columns one by one

3. **If columns exist but still getting cache errors**, contact Supabase support or try:
   - Deploying to a new Supabase project
   - Using Supabase's Project Settings → Database → Connection Pooling → Restart

---

## Quick Summary

**Fastest Fix:** Pause + Resume project in Supabase Dashboard (Solution 1)

**Second Fastest:** Run `NOTIFY pgrst, 'reload schema'` in SQL Editor (Solution 2)

**If Desperate:** Restart your local dev server and hard refresh browser

This is a known Supabase quirk - the columns exist in the database, PostgREST just doesn't know about them yet!
