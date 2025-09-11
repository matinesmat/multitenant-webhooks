-- FINAL FIX: Completely disable all webhook triggers and functions
-- Run this in your Supabase SQL Editor to fix the webhook_outbox error

-- 1. Drop ALL webhook-related triggers
DROP TRIGGER IF EXISTS students_notify_trigger ON students;
DROP TRIGGER IF EXISTS agencies_notify_trigger ON agencies;
DROP TRIGGER IF EXISTS applications_notify_trigger ON applications;
DROP TRIGGER IF EXISTS agency_student_notify_trigger ON agency_student;

-- 2. Drop ALL webhook-related functions
DROP FUNCTION IF EXISTS notify_nextjs_backend();
DROP FUNCTION IF EXISTS notify_nextjs_backend_students();
DROP FUNCTION IF EXISTS notify_nextjs_backend_agencies();
DROP FUNCTION IF EXISTS notify_nextjs_backend_applications();

-- 3. Drop any webhook_outbox related functions or triggers
DROP FUNCTION IF EXISTS process_webhook_outbox();
DROP FUNCTION IF EXISTS retry_failed_webhooks();
DROP TRIGGER IF EXISTS webhook_outbox_updated_at ON webhook_outbox;

-- 4. Drop the webhook_outbox table completely (if it exists)
DROP TABLE IF EXISTS webhook_outbox CASCADE;

-- 5. Remove any webhook_outbox related policies
DROP POLICY IF EXISTS "Users can view webhook_outbox for their organizations" ON webhook_outbox;
DROP POLICY IF EXISTS "Users can insert webhook_outbox for their organizations" ON webhook_outbox;
DROP POLICY IF EXISTS "Users can update webhook_outbox for their organizations" ON webhook_outbox;
DROP POLICY IF EXISTS "Users can delete webhook_outbox for their organizations" ON webhook_outbox;

-- This completely removes all webhook_outbox dependencies
-- Student creation will now work without any webhook dependencies
-- Webhooks are handled at the application level in Next.js actions
