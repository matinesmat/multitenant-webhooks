-- Add retry_policy column to webhook_settings table
-- Run this directly in your Supabase SQL Editor

ALTER TABLE webhook_settings 
ADD COLUMN IF NOT EXISTS retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff_multiplier": 2, "initial_delay": 1000}';

-- Update existing records to have the default retry policy
UPDATE webhook_settings 
SET retry_policy = '{"max_retries": 3, "backoff_multiplier": 2, "initial_delay": 1000}'
WHERE retry_policy IS NULL;
