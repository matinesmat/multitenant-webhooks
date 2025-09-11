-- Fix webhook_settings table to make org_id optional
-- Run this in your Supabase SQL Editor

-- Make org_id nullable so we can use org_slug instead
ALTER TABLE webhook_settings 
ALTER COLUMN org_id DROP NOT NULL;

-- Add a check constraint to ensure either org_id or org_slug is provided
ALTER TABLE webhook_settings 
ADD CONSTRAINT check_org_reference 
CHECK (org_id IS NOT NULL OR org_slug IS NOT NULL);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'webhook_settings' 
ORDER BY ordinal_position;
