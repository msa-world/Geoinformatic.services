-- Create the profiles storage bucket for user avatars and CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Enable public read access to the profiles bucket
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES ('profiles', '.gitkeep', NULL, NULL)
ON CONFLICT DO NOTHING;
