-- Simple script to disable webhook triggers
-- Run this in your Supabase SQL Editor

-- Disable all webhook triggers that cause errors
DROP TRIGGER IF EXISTS students_notify_trigger ON students;
DROP TRIGGER IF EXISTS agencies_notify_trigger ON agencies;
DROP TRIGGER IF EXISTS applications_notify_trigger ON applications;
DROP TRIGGER IF EXISTS agency_student_notify_trigger ON agency_student;

-- This allows all operations to work without webhook_outbox dependency
-- Webhooks are handled at the application level in Next.js
