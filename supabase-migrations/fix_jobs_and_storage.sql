-- ==========================================================
-- FIXED SCRIPT: JOBS TABLE & STORAGE PERMISSIONS
-- Run this in Supabase SQL Editor
-- ==========================================================

-- 1. Job Columns (Safe to run multiple times)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS salary_min INTEGER,
ADD COLUMN IF NOT EXISTS salary_max INTEGER,
ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS brand_logo_url TEXT,
ADD COLUMN IF NOT EXISTS external_link TEXT;

-- 2. Create Storage Bucket (Safe insert)
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-assets', 'job-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies (Drop first to avoid conflicts, then recreate)
-- Note: We skip "ALTER TABLE storage.objects ENABLE RLS" as it's default and restricted.

DROP POLICY IF EXISTS "Public Access to Job Assets" ON storage.objects;
CREATE POLICY "Public Access to Job Assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'job-assets' );

DROP POLICY IF EXISTS "Authenticated Users Can Upload Job Assets" ON storage.objects;
CREATE POLICY "Authenticated Users Can Upload Job Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'job-assets' );

DROP POLICY IF EXISTS "Users Can Update Own Job Assets" ON storage.objects;
CREATE POLICY "Users Can Update Own Job Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'job-assets' );

DROP POLICY IF EXISTS "Users Can Delete Own Job Assets" ON storage.objects;
CREATE POLICY "Users Can Delete Own Job Assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( auth.uid() = owner AND bucket_id = 'job-assets' );
