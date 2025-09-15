-- Migration to support Clerk user IDs in the users table
-- Run this in your Supabase SQL Editor

-- First, we need to drop all foreign key constraints that reference users.id
ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_user_id_fkey;
ALTER TABLE study_sessions DROP CONSTRAINT IF EXISTS study_sessions_user_id_fkey;
ALTER TABLE subject_grades DROP CONSTRAINT IF EXISTS subject_grades_user_id_fkey;
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE tests DROP CONSTRAINT IF EXISTS tests_user_id_fkey;
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_user_id_fkey;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_user_id_fkey;
ALTER TABLE brain_dumps DROP CONSTRAINT IF EXISTS brain_dumps_user_id_fkey;
ALTER TABLE priority_tasks DROP CONSTRAINT IF EXISTS priority_tasks_user_id_fkey;
ALTER TABLE study_groups DROP CONSTRAINT IF EXISTS study_groups_created_by_fkey;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE daily_posts DROP CONSTRAINT IF EXISTS daily_posts_user_id_fkey;
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_user_id_fkey;
ALTER TABLE question_likes DROP CONSTRAINT IF EXISTS question_likes_user_id_fkey;
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_user_id_fkey;
ALTER TABLE answer_likes DROP CONSTRAINT IF EXISTS answer_likes_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE timer_sessions DROP CONSTRAINT IF EXISTS timer_sessions_user_id_fkey;
ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_user_id_fkey;
ALTER TABLE study_notes DROP CONSTRAINT IF EXISTS study_notes_user_id_fkey;

-- Drop the existing users table
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table with VARCHAR id to support Clerk user IDs
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY, -- Changed from UUID to VARCHAR for Clerk IDs
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate all tables that reference users with VARCHAR user_id
ALTER TABLE exams ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE study_sessions ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE subject_grades ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_settings ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE tests ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE test_results ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE subjects ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE brain_dumps ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE priority_tasks ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE study_groups ALTER COLUMN created_by TYPE VARCHAR(255);
ALTER TABLE group_members ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE daily_posts ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE post_likes ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE post_comments ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE questions ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE question_likes ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE answers ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE answer_likes ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE notifications ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE timer_sessions ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE calendar_events ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE study_notes ALTER COLUMN user_id TYPE VARCHAR(255);

-- Re-add foreign key constraints
ALTER TABLE exams ADD CONSTRAINT exams_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE subject_grades ADD CONSTRAINT subject_grades_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tests ADD CONSTRAINT tests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE test_results ADD CONSTRAINT test_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE subjects ADD CONSTRAINT subjects_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE brain_dumps ADD CONSTRAINT brain_dumps_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE priority_tasks ADD CONSTRAINT priority_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE study_groups ADD CONSTRAINT study_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE group_members ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE daily_posts ADD CONSTRAINT daily_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE post_likes ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE post_comments ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE questions ADD CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE question_likes ADD CONSTRAINT question_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE answers ADD CONSTRAINT answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE answer_likes ADD CONSTRAINT answer_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE timer_sessions ADD CONSTRAINT timer_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE study_notes ADD CONSTRAINT study_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Recreate trigger for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Public read access" ON users;
DROP POLICY IF EXISTS "Public write access" ON users;
DROP POLICY IF EXISTS "Public update access" ON users;
DROP POLICY IF EXISTS "Public delete access" ON users;

CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public write access" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON users FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON users FOR DELETE USING (true);

-- Insert a test user with a Clerk-like ID (optional, for testing)
INSERT INTO users (id, email, name, profile_picture_url) VALUES
('user_test_clerk_id_example', 'test@example.com', 'Test User', NULL)
ON CONFLICT (id) DO NOTHING;