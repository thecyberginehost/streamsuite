# Fix: Schema Cache Not Refreshed

## The Problem

You added columns to the `workflows` table, but Supabase's API (PostgREST) still shows the error:
```
Could not find the 'credits_used' column of 'workflows' in the schema cache
```

**Why?** Supabase caches the database schema for performance. After schema changes, you must manually reload the cache.

You also have a missing `profiles` table that's causing errors in the TopBar.

## Quick Fix (1 minute)

### Step 1: Open Supabase SQL Editor

1. Go to [https://supabase.com](https://supabase.com)
2. Open your project
3. Click **"SQL Editor"** in sidebar
4. Click **"New Query"**

### Step 2: Run This SQL

Copy and paste this entire script:

```sql
-- Fix Schema Cache and Add Missing Profiles Table

-- Step 1: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  credits_remaining INTEGER DEFAULT 5,
  total_workflows_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 2: Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Force reload schema cache
NOTIFY pgrst, 'reload schema';

-- Step 4: Verify everything exists
SELECT 'Profiles table columns:' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT 'Workflows table columns:' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'workflows'
ORDER BY ordinal_position;

SELECT '✅ Setup complete! Schema cache reloaded.' as status;
```

Or use the file: [fix_schema_cache_and_profiles.sql](../database/fix_schema_cache_and_profiles.sql)

### Step 3: Click Run

1. Click **"Run"** button (or Ctrl+Enter)
2. Wait ~3 seconds
3. Check output - should see both tables' columns listed

### Step 4: Create Profile for Existing User

If you already have a user account, manually create a profile:

```sql
-- Replace YOUR_USER_ID with your actual user ID from auth.users
INSERT INTO public.profiles (id, email, full_name, credits_remaining)
VALUES (
  'YOUR_USER_ID',
  'your_email@example.com',
  'Your Name',
  5
);
```

To find your user ID:
```sql
SELECT id, email FROM auth.users;
```

### Step 5: Test in App

1. **Refresh your browser** (hard refresh: Ctrl+Shift+R / Cmd+Shift+R)
2. Generate a workflow
3. Click **"Save"** button
4. Should see: **"✅ Saved to history!"**
5. No more TopBar errors about missing profiles table

---

## What This Fixes

1. ✅ **Schema cache reloaded** - Supabase now knows about `credits_used` and other new columns
2. ✅ **Profiles table created** - User profile data can now be stored
3. ✅ **RLS policies added** - Users can only see/edit their own profile
4. ✅ **Auto-profile creation** - New signups automatically get a profile

---

## Troubleshooting

### Error: "relation already exists"

That's fine! It means the profiles table was already created. The script will skip it.

### Still getting schema cache errors?

**Option 1: Restart Supabase Project**
1. Go to Supabase Dashboard
2. Settings → General
3. Click "Pause project"
4. Wait 10 seconds
5. Click "Resume project"

**Option 2: Manual cache reload**
```sql
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```

### TopBar still shows profile errors?

1. Check if profile exists for your user:
   ```sql
   SELECT * FROM public.profiles WHERE id = auth.uid();
   ```
2. If empty, manually insert your profile (see Step 4 above)
3. Hard refresh browser (Ctrl+Shift+R)

---

## Summary

1. ✅ Run the SQL script above
2. ✅ Create profile for existing user (if needed)
3. ✅ Hard refresh browser
4. ✅ Test save functionality
5. ✅ Done!

Takes 1 minute. Your app will be fully functional after this! 🎉
