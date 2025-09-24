-- ============================================
-- SUPABASE AUTH INTEGRATION FIX V2
-- ============================================
-- Run this SQL in your Supabase SQL Editor to fix user sync issues
-- This version handles the view dependency issue

-- First, drop the view that depends on user_id columns
DROP VIEW IF EXISTS answer_sheet_summary;

-- Fix answer_sheets table to reference the custom users table instead of auth.users
ALTER TABLE answer_sheets DROP CONSTRAINT IF EXISTS answer_sheets_user_id_fkey;
ALTER TABLE answer_sheets ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE answer_sheets ADD CONSTRAINT answer_sheets_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Fix answer_key_templates table to reference the custom users table
ALTER TABLE answer_key_templates DROP CONSTRAINT IF EXISTS answer_key_templates_created_by_fkey;
ALTER TABLE answer_key_templates ALTER COLUMN created_by TYPE VARCHAR(255);
ALTER TABLE answer_key_templates ADD CONSTRAINT answer_key_templates_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- Fix answer_key_usage_logs table to reference the custom users table
ALTER TABLE answer_key_usage_logs DROP CONSTRAINT IF EXISTS answer_key_usage_logs_graded_by_fkey;
ALTER TABLE answer_key_usage_logs ALTER COLUMN graded_by TYPE VARCHAR(255);
ALTER TABLE answer_key_usage_logs ADD CONSTRAINT answer_key_usage_logs_graded_by_fkey 
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE CASCADE;

-- Ensure all other tables use VARCHAR(255) for user_id (should already be done by Clerk migration)
-- But let's double-check the most important ones

-- Check and fix subjects table if needed
DO $$
BEGIN
    -- Check if subjects.user_id is UUID type and convert if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subjects' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_user_id_fkey;
        ALTER TABLE subjects ALTER COLUMN user_id TYPE VARCHAR(255);
        ALTER TABLE subjects ADD CONSTRAINT subjects_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check and fix other important tables
DO $$
BEGIN
    -- Fix exams table if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_user_id_fkey;
        ALTER TABLE exams ALTER COLUMN user_id TYPE VARCHAR(255);
        ALTER TABLE exams ADD CONSTRAINT exams_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Fix brain_dumps table if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'brain_dumps' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE brain_dumps DROP CONSTRAINT IF EXISTS brain_dumps_user_id_fkey;
        ALTER TABLE brain_dumps ALTER COLUMN user_id TYPE VARCHAR(255);
        ALTER TABLE brain_dumps ADD CONSTRAINT brain_dumps_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Fix priority_tasks table if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'priority_tasks' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE priority_tasks DROP CONSTRAINT IF EXISTS priority_tasks_user_id_fkey;
        ALTER TABLE priority_tasks ALTER COLUMN user_id TYPE VARCHAR(255);
        ALTER TABLE priority_tasks ADD CONSTRAINT priority_tasks_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Fix study_sessions table if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_sessions' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE study_sessions DROP CONSTRAINT IF EXISTS study_sessions_user_id_fkey;
        ALTER TABLE study_sessions ALTER COLUMN user_id TYPE VARCHAR(255);
        ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Fix subject_grades table if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subject_grades' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE subject_grades DROP CONSTRAINT IF EXISTS subject_grades_user_id_fkey;
        ALTER TABLE subject_grades ALTER COLUMN user_id TYPE VARCHAR(255);
        ALTER TABLE subject_grades ADD CONSTRAINT subject_grades_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Fix user_settings table if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
        ALTER TABLE user_settings ALTER COLUMN user_id TYPE VARCHAR(255);
        ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Fix timer_sessions table if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timer_sessions' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE timer_sessions DROP CONSTRAINT IF EXISTS timer_sessions_user_id_fkey;
        ALTER TABLE timer_sessions ALTER COLUMN user_id TYPE VARCHAR(255);
        ALTER TABLE timer_sessions ADD CONSTRAINT timer_sessions_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Fix study_notes table if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_notes' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE study_notes DROP CONSTRAINT IF EXISTS study_notes_user_id_fkey;
        ALTER TABLE study_notes ALTER COLUMN user_id TYPE VARCHAR(255);
        ALTER TABLE study_notes ADD CONSTRAINT study_notes_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    -- Fix calendar_events table if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_user_id_fkey;
        ALTER TABLE calendar_events ALTER COLUMN user_id TYPE VARCHAR(255);
        ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Recreate the answer_sheet_summary view
CREATE OR REPLACE VIEW answer_sheet_summary AS
SELECT
    a.id,
    a.user_id,
    a.subject,
    a.sheet_name,
    a.test_type,
    a.total_questions,
    a.mcq_questions,
    a.text_questions,
    a.status,
    a.score,
    a.grade,
    a.submitted_at,
    a.created_at,
    COUNT(r.id) as answered_questions,
    COUNT(CASE WHEN r.question_type = 'mcq' AND r.mcq_option IS NOT NULL THEN 1 END) as mcq_answered,
    COUNT(CASE WHEN r.question_type = 'text' AND r.text_answer IS NOT NULL AND r.text_answer != '' THEN 1 END) as text_answered,
    ROUND((COUNT(r.id) * 100.0 / NULLIF(a.total_questions, 0)), 2) as completion_percentage
FROM answer_sheets a
LEFT JOIN answer_sheet_responses r ON a.id = r.answer_sheet_id
AND ((r.question_type = 'mcq' AND r.mcq_option IS NOT NULL) OR (r.question_type = 'text' AND r.text_answer IS NOT NULL AND r.text_answer != ''))
GROUP BY a.id, a.user_id, a.subject, a.sheet_name, a.test_type, a.total_questions,
         a.mcq_questions, a.text_questions, a.status, a.score, a.grade, a.submitted_at, a.created_at;

-- Create a function to create unified subjects for all users
CREATE OR REPLACE FUNCTION create_unified_subjects_for_user(p_user_id VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert unified subjects that all users should have
    INSERT INTO subjects (user_id, name, color, mcq_questions, text_questions, total_questions, question_config) VALUES
        (p_user_id, 'Korean', '#FF6B6B', 34, 11, 45, '{"1-34": "mcq", "35-45": "text"}'),
        (p_user_id, 'Mathematics', '#4ECDC4', 30, 0, 30, '{"1-30": "mcq"}'),
        (p_user_id, 'English', '#45B7D1', 45, 0, 45, '{"1-45": "mcq"}'),
        (p_user_id, 'Others', '#96CEB4', 20, 0, 20, '{"1-20": "mcq"}')
    ON CONFLICT (user_id, name) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to automatically create subjects when a user is created
CREATE OR REPLACE FUNCTION create_subjects_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create unified subjects for the new user
    PERFORM create_unified_subjects_for_user(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS create_subjects_on_user_insert ON users;
CREATE TRIGGER create_subjects_on_user_insert
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_subjects_for_new_user();

-- Update RLS policies to be more permissive for testing
-- (You can make these more restrictive later based on your needs)

-- Update subjects policies to allow public access for now
DROP POLICY IF EXISTS "Users can view their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can insert their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can update their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can delete their own subjects" ON subjects;

CREATE POLICY "Public read access" ON subjects FOR SELECT USING (true);
CREATE POLICY "Public write access" ON subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON subjects FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON subjects FOR DELETE USING (true);

-- Clean up any existing test data with wrong user ID format
DELETE FROM answer_sheets WHERE user_id = 'bdfd8c34-a28f-4101-97e0-894c3fa5c7a6';
DELETE FROM answer_key_templates WHERE created_by = 'bdfd8c34-a28f-4101-97e0-894c3fa5c7a6';

-- Create a function to sync Supabase Auth users to the custom users table
CREATE OR REPLACE FUNCTION sync_auth_user_to_users_table()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user in custom users table
    INSERT INTO users (id, email, name, profile_picture_url, created_at, updated_at)
    VALUES (
        NEW.id::TEXT,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        profile_picture_url = COALESCE(EXCLUDED.profile_picture_url, users.profile_picture_url),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to automatically sync to custom users table
DROP TRIGGER IF EXISTS sync_auth_user_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_auth_user_to_users_table();

-- Manually sync any existing auth users to the custom users table
INSERT INTO users (id, email, name, profile_picture_url, created_at, updated_at)
SELECT 
    id::TEXT,
    email,
    COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    raw_user_meta_data->>'avatar_url',
    created_at,
    updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    profile_picture_url = COALESCE(EXCLUDED.profile_picture_url, users.profile_picture_url),
    updated_at = NOW();

-- Create unified subjects for all existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM users LOOP
        PERFORM create_unified_subjects_for_user(user_record.id);
    END LOOP;
END $$;