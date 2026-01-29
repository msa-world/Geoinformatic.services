-- Add columns to store Google OAuth tokens for profiles and create oauth_states table
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS google_refresh_token text,
  ADD COLUMN IF NOT EXISTS google_access_token text,
  ADD COLUMN IF NOT EXISTS google_connected_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS google_scope text;

-- Temporary state table to map OAuth states to user ids
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state text PRIMARY KEY,
  user_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
