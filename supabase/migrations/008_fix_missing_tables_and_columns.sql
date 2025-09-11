-- Fix missing tables and columns for webhook functionality
-- Note: webhook_outbox table removed - webhooks handled at application level

-- Add organization_id to agencies table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'organization_id') THEN
        ALTER TABLE agencies ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add organization_id to agency_student table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_student' AND column_name = 'organization_id') THEN
        ALTER TABLE agency_student ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add organization_id to applications table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'organization_id') THEN
        ALTER TABLE applications ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add organization_id to webhook_settings table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_settings' AND column_name = 'organization_id') THEN
        ALTER TABLE webhook_settings ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance (webhook_outbox indexes removed)

CREATE INDEX IF NOT EXISTS idx_agencies_organization_id ON agencies(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_student_organization_id ON agency_student(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_organization_id ON applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_settings_organization_id ON webhook_settings(organization_id);

-- RLS policies and triggers for webhook_outbox removed

-- Database triggers removed - webhooks handled at application level
