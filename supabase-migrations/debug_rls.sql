-- =====================================================
-- TEMPORARY DEBUG SQL - RUN THIS IN SUPABASE SQL EDITOR
-- =====================================================
-- This script DISABLES RLS temporarily to verify data exists
-- and then creates simple, working policies

-- STEP 1: Check what data exists
SELECT 'JOBS TABLE:' as info;
SELECT id, title, posted_by, status FROM jobs LIMIT 10;

SELECT 'JOB_APPLICATIONS TABLE:' as info;
SELECT id, job_id, user_id, status FROM job_applications LIMIT 10;

SELECT 'AUTH USERS:' as info;
SELECT id, email FROM auth.users LIMIT 5;

-- STEP 2: Disable RLS temporarily to test if that's the issue
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;

-- STEP 3: After testing, if it works, re-enable RLS with simple policies
-- Run these AFTER confirming the pages work:

-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- SIMPLE POLICIES (uncomment and run after testing):
-- DROP POLICY IF EXISTS "Allow all on jobs" ON jobs;
-- CREATE POLICY "Allow all on jobs" ON jobs FOR ALL USING (true) WITH CHECK (true);

-- DROP POLICY IF EXISTS "Allow all on job_applications" ON job_applications;
-- CREATE POLICY "Allow all on job_applications" ON job_applications FOR ALL USING (true) WITH CHECK (true);
