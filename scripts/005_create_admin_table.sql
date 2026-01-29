-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (password: Geo@1122)
INSERT INTO admin_users (username, password_hash, email)
VALUES ('admin', '$2b$10$YIjlrKxHJ8Z8F5Q8K3Z2Z.Y8K8F5Q8K3Z2Z.Y8K8F5Q8K3Z2Z', 'admin@geo-informatic.com')
ON CONFLICT (username) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
