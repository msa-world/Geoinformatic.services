-- =====================================================
-- DEBUG: Check job_applications data
-- =====================================================
-- Run each section one at a time in Supabase SQL Editor

-- 1. See all applications in the database
SELECT 
    ja.id,
    ja.job_id,
    ja.user_id,
    ja.status,
    ja.created_at,
    j.title as job_title
FROM job_applications ja
LEFT JOIN jobs j ON ja.job_id = j.id;

-- 2. See all profiles and their IDs
SELECT id, full_name, email FROM profiles;

-- 3. See all auth users
SELECT id, email FROM auth.users;

-- 4. Compare: Does profile.id match auth.users.id?
-- They SHOULD be the same. If not, that's the problem!
SELECT 
    p.id as profile_id,
    p.email as profile_email,
    u.id as auth_user_id,
    u.email as auth_email,
    CASE WHEN p.id = u.id THEN 'MATCH' ELSE 'MISMATCH' END as status
FROM profiles p
FULL OUTER JOIN auth.users u ON p.email = u.email;

-- 5. If there are mismatches, run this to see which user_id values 
--    in job_applications don't exist in auth.users:
SELECT ja.user_id, ja.status, ja.created_at
FROM job_applications ja
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = ja.user_id
);
