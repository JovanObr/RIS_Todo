USE todo_db;

-- Add OAuth2 fields to users table
ALTER TABLE users
    ADD COLUMN provider VARCHAR(20) DEFAULT 'LOCAL' COMMENT 'Authentication provider: LOCAL, GOOGLE, FACEBOOK, GITHUB',
ADD COLUMN provider_id VARCHAR(255) NULL COMMENT 'Unique ID from OAuth provider',
ADD COLUMN profile_picture_url VARCHAR(500) NULL COMMENT 'Profile picture URL from OAuth provider';

-- Create index for OAuth lookups
CREATE INDEX idx_provider_id ON users(provider, provider_id);

-- Update existing users to have LOCAL provider
UPDATE users SET provider = 'LOCAL' WHERE provider IS NULL;

-- Verify changes
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'todo_db'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('provider', 'provider_id', 'profile_picture_url');

-- Show sample of updated data
SELECT id, username, email, provider, provider_id, profile_picture_url
FROM users
         LIMIT 5;