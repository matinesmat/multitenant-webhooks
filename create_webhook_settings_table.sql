-- Create webhook_settings table with all necessary columns
-- Run this directly in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS webhook_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    org_slug TEXT NOT NULL,
    name TEXT,
    url TEXT NOT NULL,
    bearer_token TEXT,
    json_body TEXT,
    event_type TEXT,
    enabled BOOLEAN DEFAULT true,
    secret_key TEXT,
    resources TEXT[] DEFAULT '{}',
    events TEXT[] DEFAULT '{}',
    retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff_multiplier": 2, "initial_delay": 1000}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_settings_org_slug ON webhook_settings(org_slug);
CREATE INDEX IF NOT EXISTS idx_webhook_settings_org_id ON webhook_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_webhook_settings_enabled ON webhook_settings(enabled);
CREATE INDEX IF NOT EXISTS idx_webhook_settings_created_at ON webhook_settings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE webhook_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view webhook settings for their organizations" ON webhook_settings
    FOR SELECT USING (
        org_slug IN (
            SELECT slug FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert webhook settings for their organizations" ON webhook_settings
    FOR INSERT WITH CHECK (
        org_slug IN (
            SELECT slug FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update webhook settings for their organizations" ON webhook_settings
    FOR UPDATE USING (
        org_slug IN (
            SELECT slug FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete webhook settings for their organizations" ON webhook_settings
    FOR DELETE USING (
        org_slug IN (
            SELECT slug FROM organizations WHERE owner_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_webhook_settings_updated_at
    BEFORE UPDATE ON webhook_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
