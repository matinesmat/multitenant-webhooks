-- Add missing columns to existing tables

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

-- Create webhooks_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhooks_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id UUID REFERENCES webhook_settings(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id TEXT,
    payload JSONB NOT NULL,
    endpoint_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agencies_organization_id ON agencies(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_student_organization_id ON agency_student(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_organization_id ON applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_settings_organization_id ON webhook_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_log_organization_id ON webhooks_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_log_webhook_id ON webhooks_log(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_log_status ON webhooks_log(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_log_created_at ON webhooks_log(created_at DESC);

-- Enable Row Level Security for webhooks_log
ALTER TABLE webhooks_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for webhooks_log
CREATE POLICY "Users can view webhooks_log for their organizations" ON webhooks_log
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for webhooks_log updated_at
CREATE TRIGGER update_webhooks_log_updated_at
    BEFORE UPDATE ON webhooks_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
