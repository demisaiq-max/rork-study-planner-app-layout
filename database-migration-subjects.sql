-- Add additional columns to existing subjects table for unified subject management
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#4ECDC4';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS mcq_questions INTEGER NOT NULL DEFAULT 20;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS text_questions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS total_questions INTEGER NOT NULL DEFAULT 20;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS question_config JSONB;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_created_at ON subjects(created_at);

-- Add RLS policies
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own subjects
CREATE POLICY "Users can view their own subjects" ON subjects
  FOR SELECT USING (user_id = auth.uid());

-- Policy for users to insert their own subjects
CREATE POLICY "Users can insert their own subjects" ON subjects
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own subjects
CREATE POLICY "Users can update their own subjects" ON subjects
  FOR UPDATE USING (user_id = auth.uid());

-- Policy for users to delete their own subjects
CREATE POLICY "Users can delete their own subjects" ON subjects
  FOR DELETE USING (user_id = auth.uid());

-- Update answer_sheets table to reference subjects
ALTER TABLE answer_sheets ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_answer_sheets_subject_id ON answer_sheets(subject_id);

-- Update exams table to reference subjects by ID instead of name
ALTER TABLE exams ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON exams(subject_id);

-- Insert default subjects for the specified user
INSERT INTO subjects (user_id, name, color, mcq_questions, text_questions, total_questions) VALUES
  ('bdfd8c34-a28f-4101-97e0-894c3fa5c7a6'::uuid, 'Korean', '#FF6B6B', 20, 0, 20),
  ('bdfd8c34-a28f-4101-97e0-894c3fa5c7a6'::uuid, 'Mathematics', '#4ECDC4', 20, 0, 20),
  ('bdfd8c34-a28f-4101-97e0-894c3fa5c7a6'::uuid, 'English', '#45B7D1', 20, 0, 20),
  ('bdfd8c34-a28f-4101-97e0-894c3fa5c7a6'::uuid, 'Others', '#96CEB4', 20, 0, 20)
ON CONFLICT (user_id, name) DO NOTHING;

-- Note: You may need to manually migrate existing data from the 'subject' text field to the new subject_id UUID field
-- This migration script creates the structure but doesn't migrate existing data to avoid data loss