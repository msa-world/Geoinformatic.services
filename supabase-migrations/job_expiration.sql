-- Add expires_at column with default 30 days from creation
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days');

-- Function to delete expired jobs
CREATE OR REPLACE FUNCTION delete_expired_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM jobs WHERE expires_at < now();
END;
$$;

-- Note: To automate this, you would enable pg_cron extension:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('0 0 * * *', $$SELECT delete_expired_jobs()$$);
