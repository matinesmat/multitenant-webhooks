-- IMMEDIATE FIX: Remove webhook_outbox dependency for student creation
-- Run this in your Supabase SQL Editor RIGHT NOW

-- Drop the problematic triggers that cause webhook_outbox errors
DROP TRIGGER IF EXISTS students_notify_trigger ON students;
DROP TRIGGER IF EXISTS agencies_notify_trigger ON agencies;
DROP TRIGGER IF EXISTS applications_notify_trigger ON applications;
DROP TRIGGER IF EXISTS agency_student_notify_trigger ON agency_student;

-- Drop the functions that use webhook_outbox
DROP FUNCTION IF EXISTS notify_nextjs_backend();
DROP FUNCTION IF EXISTS notify_nextjs_backend_students();

-- This will immediately fix the student creation error
-- Student creation will work without any webhook dependencies
