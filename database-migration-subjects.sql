-- Create subjects table for unified subject management
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4ECDC4',
  mcq_questions INTEGER NOT NULL DEFAULT 20,
  text_questions INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 20,
  question_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_created_at ON subjects(created_at);

-- Add RLS policies
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own subjects
CREATE POLICY "Users can view their own subjects" ON subjects
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy for users to insert their own subjects
CREATE POLICY "Users can insert their own subjects" ON subjects
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy for users to update their own subjects
CREATE POLICY "Users can update their own subjects" ON subjects
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy for users to delete their own subjects
CREATE POLICY "Users can delete their own subjects" ON subjects
  FOR DELETE USING (auth.uid()::text = user_id);

-- Update answer_sheets table to reference subjects
ALTER TABLE answer_sheets ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_answer_sheets_subject_id ON answer_sheets(subject_id);

-- Update exams table to reference subjects by ID instead of name
ALTER TABLE exams ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON exams(subject_id);

-- Note: You may need to manually migrate existing data from the 'subject' text field to the new subject_id UUID field
-- This migration script creates the structure but doesn't migrate existing data to avoid data loss