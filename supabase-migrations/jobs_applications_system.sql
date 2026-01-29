-- =====================================================
-- SUPABASE SQL MIGRATION FOR JOBS & APPLICATIONS SYSTEM
-- =====================================================
-- Run this in your Supabase SQL Editor
-- This script is IDEMPOTENT - safe to run multiple times
-- UPDATED: More permissive RLS policies

-- 1. Add 'posted_by' column to jobs table (if it doesn't exist)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS salary_min INTEGER,
ADD COLUMN IF NOT EXISTS salary_max INTEGER,
ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS brand_logo_url TEXT,
ADD COLUMN IF NOT EXISTS external_link TEXT;

-- 2. Create job_applications table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'ACCEPTED')),
    cover_letter TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure a user can only apply once per job
    UNIQUE(job_id, user_id)
);

-- 3. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP ALL EXISTING POLICIES (clean slate)
-- =====================================================

-- Drop job_applications policies
DROP POLICY IF EXISTS "Users can view own applications" ON job_applications;
DROP POLICY IF EXISTS "Job posters can view applications" ON job_applications;
DROP POLICY IF EXISTS "Users can create own applications" ON job_applications;
DROP POLICY IF EXISTS "Job posters can update application status" ON job_applications;
DROP POLICY IF EXISTS "Anyone can view applications" ON job_applications;
DROP POLICY IF EXISTS "Authenticated users can insert applications" ON job_applications;
DROP POLICY IF EXISTS "Allow all reads on job_applications" ON job_applications;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON job_applications;

-- Drop jobs policies
DROP POLICY IF EXISTS "Anyone can view open jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON jobs;
DROP POLICY IF EXISTS "Job posters can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Job posters can delete own jobs" ON jobs;
DROP POLICY IF EXISTS "Anyone can view jobs" ON jobs;
DROP POLICY IF EXISTS "Allow all reads on jobs" ON jobs;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON jobs;

-- =====================================================
-- CREATE NEW POLICIES FOR JOBS
-- =====================================================

-- Anyone can view any job (for the listing page)
CREATE POLICY "Anyone can view jobs" ON jobs
    FOR SELECT 
    USING (true);

-- Authenticated users can create jobs (posted_by must match their ID)
CREATE POLICY "Authenticated users can create jobs" ON jobs
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = posted_by);

-- Job posters can update their own jobs
CREATE POLICY "Job posters can update own jobs" ON jobs
    FOR UPDATE 
    USING (auth.uid() = posted_by);

-- Job posters can delete their own jobs
CREATE POLICY "Job posters can delete own jobs" ON jobs
    FOR DELETE 
    USING (auth.uid() = posted_by);

-- =====================================================
-- CREATE NEW POLICIES FOR JOB_APPLICATIONS
-- =====================================================

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON job_applications
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Job posters can view applications for their jobs
CREATE POLICY "Job posters can view applications" ON job_applications
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM jobs WHERE jobs.id = job_applications.job_id AND jobs.posted_by = auth.uid()
        )
    );

-- Users can create applications for themselves
CREATE POLICY "Users can create own applications" ON job_applications
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Job posters can update application status for their jobs
CREATE POLICY "Job posters can update application status" ON job_applications
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM jobs WHERE jobs.id = job_applications.job_id AND jobs.posted_by = auth.uid()
        )
    );

-- =====================================================
-- TRIGGER FOR UPDATING TIMESTAMPS
-- =====================================================

-- Create or replace function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to job_applications
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES (run these to check your data)
-- =====================================================
-- SELECT * FROM jobs LIMIT 10;
-- SELECT * FROM job_applications LIMIT 10;
-- SELECT id, email FROM auth.users LIMIT 5;

-- =====================================================
-- DONE! Run this script again after clearing old policies.
-- =====================================================
