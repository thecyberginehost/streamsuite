# Complete Database Setup Instructions

## The Problem

Your StreamSuite app is connected to Supabase, but the database tables aren't fully set up. You're seeing these errors:

1. ❌ `Could not find the table 'public.profiles' in the schema cache`
2. ❌ `Could not find the 'credits_used' column of 'workflows' in the schema cache`
3. ❌ `column workflows.user_id does not exist`

## The Solution (3 Minutes)

Run ONE comprehensive SQL script that fixes everything.

---

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

1. Go to **[https://supabase.com/dashboard](https://supabase.com/dashboard)**
2. Select your project: **tlxpfjjckmvotkdiabll**
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"** button

### 2. Copy the Complete Setup Script

Open this file in your project:
📁 **[database/COMPLETE_DATABASE_SETUP.sql](../database/COMPLETE_DATABASE_SETUP.sql)**

Copy the **entire contents** of that file (all 300+ lines).

### 3. Paste and Run

1. Paste the entire script into the Supabase SQL Editor
2. Click the **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
3. Wait ~5 seconds for it to complete

### 4. Verify Success

You should see output showing:

✅ **All tables in public schema:**
- profiles (9 columns)
- workflows (16 columns)

✅ **Profiles table columns:**
- id, email, full_name, avatar_url, subscription_tier, credits_remaining, etc.

✅ **Workflows table columns:**
- id, **user_id** ← Should be there now!
- name, description, platform, workflow_json
- **credits_used** ← Should be there now!
- **tokens_used** ← Should be there now!
- is_favorite, tags, status, error_message, prompt, template_used
- created_at, updated_at

✅ **Users and Profiles:**
- Shows your user email with "✅ Has Profile"

### 5. Refresh Your Browser

1. Go back to your StreamSuite app (http://localhost:5173)
2. **Hard refresh**: Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
3. All errors should be gone!

### 6. Test Everything

**Test 1: Profile Loading**
- Top bar should show your email (no errors in console)

**Test 2: Generate Workflow**
- Go to Generator page
- Generate a workflow (or use StreamBot to create a prompt)
- Click **"Save"** button
- Should see: **"✅ Saved to history!"**

**Test 3: View History**
- Go to History page
- Your saved workflow should appear there

---

## What This Script Does

### Creates/Fixes Profiles Table
- Stores user information (email, name, credits, subscription tier)
- Enables Row Level Security (users can only see their own profile)
- Auto-creates profile when new users sign up

### Creates/Fixes Workflows Table
- **Adds missing `user_id` column** (links workflows to users)
- **Adds missing `credits_used` column** (tracks credit usage)
- **Adds missing `tokens_used` column** (tracks AI token usage)
- Adds all other required columns (tags, status, prompt, etc.)
- Enables Row Level Security (users can only see their own workflows)

### Creates Profile for Your Existing User
- If you already have a user account, this creates a profile for you
- Sets your initial credits to 5 (free tier)

### Reloads Schema Cache
- Forces Supabase to recognize all new columns immediately
- This fixes the "column not in schema cache" errors

---

## Troubleshooting

### ❌ Error: "syntax error at or near..."

**Cause:** Didn't copy the entire script

**Fix:** Make sure you copied ALL lines from the SQL file, including the first `--` comments

---

### ❌ Error: "relation already exists"

**Cause:** Some tables were already partially created

**Fix:** This is OK! The script uses `IF NOT EXISTS` and will skip existing parts. Just let it run.

---

### ❌ Still seeing schema cache errors in browser

**Fix 1:** Hard refresh the browser (Ctrl+Shift+R)

**Fix 2:** Restart the dev server:
```bash
# Stop the server (Ctrl+C in terminal)
npm run dev
```

**Fix 3:** Run this additional SQL in Supabase:
```sql
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```

---

### ❌ TopBar still shows "Failed to load profile"

**Check if profile was created:**
```sql
SELECT * FROM public.profiles WHERE id = auth.uid();
```

**If empty, manually create your profile:**
```sql
-- First, get your user ID
SELECT id, email FROM auth.users;

-- Then insert your profile (replace YOUR_USER_ID and YOUR_EMAIL)
INSERT INTO public.profiles (id, email, full_name, credits_remaining)
VALUES (
  'YOUR_USER_ID',
  'YOUR_EMAIL',
  'Your Name',
  5
);
```

---

### ❌ Save still fails with "column does not exist"

**Verify the column was actually added:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'workflows' AND column_name IN ('user_id', 'credits_used', 'tokens_used');
```

**Should return 3 rows.** If not, the ALTER TABLE commands failed.

**Nuclear option - Drop and recreate workflows table:**
```sql
-- ⚠️ WARNING: This deletes ALL saved workflows!
DROP TABLE IF EXISTS public.workflows CASCADE;

-- Then re-run the COMPLETE_DATABASE_SETUP.sql script
```

---

## Summary Checklist

- [ ] 1. Open Supabase SQL Editor
- [ ] 2. Copy entire `COMPLETE_DATABASE_SETUP.sql` file
- [ ] 3. Paste and run in SQL Editor
- [ ] 4. Verify output shows all tables and columns
- [ ] 5. Hard refresh browser (Ctrl+Shift+R)
- [ ] 6. Test: Generate and save a workflow
- [ ] 7. Test: View saved workflow in History page
- [ ] ✅ Done! Everything should work now

---

## Expected Result

After running this script, your app will be **100% functional**:

✅ No TopBar errors
✅ Workflows save successfully
✅ History page shows saved workflows
✅ Credits tracking works
✅ User profiles work

**Total time:** 3 minutes
**Difficulty:** Copy/paste

🎉 Your StreamSuite database will be fully set up!
