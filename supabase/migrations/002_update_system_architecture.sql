-- Update system architecture to match the new specifications

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agency_student junction table
CREATE TABLE IF NOT EXISTS agency_student (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agency_id, student_id)
);

-- Update applications table to include organization_id
ALTER TABLE applications ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create webhooks_log table for tracking webhook deliveries
CREATE TABLE IF NOT EXISTS webhooks_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id UUID NOT NULL REFERENCES webhook_settings(id) ON DELETE CASCADE,
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

-- Update webhook_settings table
ALTER TABLE webhook_settings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS secret_key TEXT,
ADD COLUMN IF NOT EXISTS resources TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS events TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff_multiplier": 2, "initial_delay": 1000}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agencies_organization_id ON agencies(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_student_organization_id ON agency_student(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_student_agency_id ON agency_student(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_student_student_id ON agency_student(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_organization_id ON applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_log_organization_id ON webhooks_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_log_webhook_id ON webhooks_log(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_log_status ON webhooks_log(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_log_created_at ON webhooks_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_student ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agencies
CREATE POLICY "Users can view agencies for their organizations" ON agencies
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert agencies for their organizations" ON agencies
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update agencies for their organizations" ON agencies
    FOR UPDATE USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete agencies for their organizations" ON agencies
    FOR DELETE USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

-- Create RLS policies for agency_student
CREATE POLICY "Users can view agency_student for their organizations" ON agency_student
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert agency_student for their organizations" ON agency_student
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update agency_student for their organizations" ON agency_student
    FOR UPDATE USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete agency_student for their organizations" ON agency_student
    FOR DELETE USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

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

-- Create triggers for updated_at
CREATE TRIGGER update_agencies_updated_at
    BEFORE UPDATE ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agency_student_updated_at
    BEFORE UPDATE ON agency_student
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_log_updated_at
    BEFORE UPDATE ON webhooks_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Database triggers removed - webhooks handled at application level
-- Webhook functionality is now handled in Next.js server actions
