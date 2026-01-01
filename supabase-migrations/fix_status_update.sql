-- =====================================================
-- FIX: Allow job posters to update application statuses
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, let's check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('jobs', 'job_applications');

-- If RLS is disabled (rowsecurity = false), the issue is elsewhere
-- If RLS is enabled, we need to add/fix the UPDATE policy

-- Drop and recreate the update policy for job_applications
DROP POLICY IF EXISTS "Job posters can update application status" ON job_applications;

CREATE POLICY "Job posters can update application status" ON job_applications
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE jobs.id = job_applications.job_id 
        AND jobs.posted_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE jobs.id = job_applications.job_id 
        AND jobs.posted_by = auth.uid()
    )
);

-- Also allow the applicant themselves to view their updated status
-- (This is for SELECT, should already exist but let's ensure)
DROP POLICY IF EXISTS "Users can view own applications" ON job_applications;
CREATE POLICY "Users can view own applications" ON job_applications
FOR SELECT USING (auth.uid() = user_id);

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'job_applications';
