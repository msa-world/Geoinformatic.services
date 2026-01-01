-- Create or update messages table used by the chat features
-- This script will create the table if it doesn't exist and add missing columns
-- Run this in your Supabase SQL editor (or psql) against the project database.

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id text,
  recipient_id text,
  content text,
  file_url text,
  file_name text,
  sender_type text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Ensure missing columns exist (safe to run multiple times)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS sender_type text,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Optional: create an index to speed up queries by recipient_id/created_at
CREATE INDEX IF NOT EXISTS idx_messages_recipient_created_at ON public.messages(recipient_id, created_at);

-- Note: After running this, if you still see the PostgREST schema cache error (PGRST204),
-- open the Supabase project dashboard -> Database -> Replication & Logs -> and use the SQL editor
-- to re-run the script or try toggling realtime/settings to force schema cache refresh.
