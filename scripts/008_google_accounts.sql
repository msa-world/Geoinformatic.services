-- Create google_accounts table to store encrypted Google OAuth tokens per user
CREATE TABLE IF NOT EXISTS public.google_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  google_id text,
  google_email text,
  encrypted_refresh_token text,
  encrypted_access_token text,
  token_expires_at timestamp with time zone,
  scope text,
  connected_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create index for quick lookup by profile_id
CREATE INDEX IF NOT EXISTS idx_google_accounts_profile_id ON public.google_accounts(profile_id);
