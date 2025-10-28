-- Step 1: Verify columns actually exist in the database
SELECT 'Checking workflows table structure...' as status;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workflows'
ORDER BY ordinal_position;

-- Step 2: Verify profiles table exists
SELECT 'Checking profiles table structure...' as status;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 3: Terminate all PostgREST connections
SELECT 'Terminating PostgREST connections...' as status;

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'authenticator';

-- Step 4: Force multiple reload notifications
SELECT 'Sending reload notifications...' as status;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Wait a moment
SELECT pg_sleep(1);

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Step 5: Verify API exposure
SELECT 'Checking if tables are exposed via API...' as status;

SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'workflows');

SELECT 'Done! Now hard refresh your browser (Ctrl+Shift+R)' as final_status;
