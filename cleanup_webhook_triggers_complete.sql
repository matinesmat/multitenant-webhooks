-- Complete cleanup of webhook triggers and functions
-- Run this in your Supabase SQL Editor to fix the net.http_post error

-- Drop all webhook-related triggers
DROP TRIGGER IF EXISTS students_notify_trigger ON students;
DROP TRIGGER IF EXISTS agencies_notify_trigger ON agencies;
DROP TRIGGER IF EXISTS applications_notify_trigger ON applications;
DROP TRIGGER IF EXISTS agency_student_notify_trigger ON agency_student;

-- Drop all webhook-related functions
DROP FUNCTION IF EXISTS notify_nextjs_backend();
DROP FUNCTION IF EXISTS notify_nextjs_backend_students();

-- This will completely remove all database-level webhook functionality
-- Webhooks are now handled at the application level in Next.js actions
