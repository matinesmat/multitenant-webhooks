-- Run this SQL in your Supabase SQL Editor to add the created_at column

-- Add created_at column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have a created_at timestamp
UPDATE organizations 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY ordinal_position;
