-- Add status column to students table if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update existing records to have 'active' status if they don't have one
UPDATE students 
SET status = 'active' 
WHERE status IS NULL;

-- Add a check constraint to ensure status values are valid
ALTER TABLE students 
ADD CONSTRAINT check_student_status 
CHECK (status IN ('active', 'pending', 'inactive'));

-- Create an index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
