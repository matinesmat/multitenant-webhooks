-- Create webhook_activity_logs table
CREATE TABLE IF NOT EXISTS webhook_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id UUID REFERENCES webhook_settings(id) ON DELETE CASCADE,
    org_slug TEXT NOT NULL,
    event_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    record_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_activity_logs_org_slug ON webhook_activity_logs(org_slug);
CREATE INDEX IF NOT EXISTS idx_webhook_activity_logs_created_at ON webhook_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_activity_logs_status ON webhook_activity_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_activity_logs_webhook_id ON webhook_activity_logs(webhook_id);

-- Enable Row Level Security
ALTER TABLE webhook_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view webhook activity logs for their organizations" ON webhook_activity_logs
    FOR SELECT USING (
        org_slug IN (
            SELECT slug FROM organizations WHERE owner_id = auth.uid()
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

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_webhook_activity_logs_updated_at
    BEFORE UPDATE ON webhook_activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
