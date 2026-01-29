-- Add file_url and file_name columns to messages table for file attachments
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_name text;
