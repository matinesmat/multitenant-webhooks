-- Add created_at column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have a created_at timestamp
UPDATE organizations 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Create an index for better performance on created_at queries
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at DESC);
