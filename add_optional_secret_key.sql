-- Add optional secret_key column to webhook_settings table
-- Run this in your Supabase SQL Editor

-- Add secret_key column as optional (nullable)
ALTER TABLE webhook_settings 
ADD COLUMN IF NOT EXISTS secret_key TEXT;

-- Add other missing columns that might be needed
ALTER TABLE webhook_settings 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

ALTER TABLE webhook_settings 
ADD COLUMN IF NOT EXISTS resources TEXT[] DEFAULT '{}';

ALTER TABLE webhook_settings 
ADD COLUMN IF NOT EXISTS events TEXT[] DEFAULT '{}';

ALTER TABLE webhook_settings 
ADD COLUMN IF NOT EXISTS retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff_multiplier": 2, "initial_delay": 1000}';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'webhook_settings' 
ORDER BY ordinal_position;
