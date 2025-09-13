-- Study Buddy App Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    subject VARCHAR(100) NOT NULL,
    priority BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subject grades table
CREATE TABLE IF NOT EXISTS subject_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    grades TEXT, -- JSON string to store grades for different exam types
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subject)
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    visible_subjects TEXT[] DEFAULT ARRAY['국어', '영어', '수학', '탐구'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(date);
CREATE INDEX IF NOT EXISTS idx_exams_priority ON exams(priority);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date);
CREATE INDEX IF NOT EXISTS idx_subject_grades_user_id ON subject_grades(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop existing ones first to avoid conflicts)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_exams_updated_at ON exams;
DROP TRIGGER IF EXISTS update_subject_grades_updated_at ON subject_grades;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subject_grades_updated_at BEFORE UPDATE ON subject_grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- You can remove this section if you don't want sample data

-- Sample user
INSERT INTO users (id, email, name) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- Sample subject grades
INSERT INTO subject_grades (user_id, subject, grade) VALUES
('550e8400-e29b-41d4-a716-446655440000', '국어', '2등급'),
('550e8400-e29b-41d4-a716-446655440000', '영어', '1등급'),
('550e8400-e29b-41d4-a716-446655440000', '수학', '3등급'),
('550e8400-e29b-41d4-a716-446655440000', '탐구', '미정')
ON CONFLICT (user_id, subject) DO NOTHING;

-- Sample user settings
INSERT INTO user_settings (user_id, visible_subjects) VALUES
('550e8400-e29b-41d4-a716-446655440000', ARRAY['국어', '영어', '수학', '탐구'])
ON CONFLICT (user_id) DO NOTHING;

-- Sample exams
INSERT INTO exams (user_id, title, date, subject, priority) VALUES
('550e8400-e29b-41d4-a716-446655440000', '수능 모의고사', '2025-09-15', '국어', true),
('550e8400-e29b-41d4-a716-446655440000', '영어 중간고사', '2025-09-20', '영어', false),
('550e8400-e29b-41d4-a716-446655440000', '수학 기말고사', '2025-10-05', '수학', true);

-- Tests table for managing different types of tests
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    test_type VARCHAR(50) NOT NULL CHECK (test_type IN ('mock', 'midterm', 'final')),
    test_name VARCHAR(255) NOT NULL,
    test_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test results table for storing test scores and analysis
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_score INTEGER,
    standard_score INTEGER,
    percentile INTEGER,
    grade INTEGER CHECK (grade >= 1 AND grade <= 9),
    answer_sheet_image_url TEXT,
    analysis_data TEXT, -- JSON string for detailed analysis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(test_id, user_id)
);

-- Create indexes for tests and test results
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_subject ON tests(subject);
CREATE INDEX IF NOT EXISTS idx_tests_type ON tests(test_type);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);

-- Create triggers for updated_at (drop existing ones first to avoid conflicts)
DROP TRIGGER IF EXISTS update_tests_updated_at ON tests;
DROP TRIGGER IF EXISTS update_test_results_updated_at ON test_results;

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_results_updated_at BEFORE UPDATE ON test_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample study sessions
INSERT INTO study_sessions (user_id, subject, duration, date) VALUES
('550e8400-e29b-41d4-a716-446655440000', '국어', 120, '2025-08-30'),
('550e8400-e29b-41d4-a716-446655440000', '영어', 90, '2025-08-30'),
('550e8400-e29b-41d4-a716-446655440000', '수학', 150, '2025-08-29');

-- Sample tests
INSERT INTO tests (user_id, subject, test_type, test_name, test_date) VALUES
('550e8400-e29b-41d4-a716-446655440000', '국어', 'mock', 'Mock Test 1', '2025-08-25'),
('550e8400-e29b-41d4-a716-446655440000', '국어', 'mock', 'Mock Test 2', '2025-09-01'),
('550e8400-e29b-41d4-a716-446655440000', '영어', 'mock', 'Mock Test 1', '2025-08-26'),
('550e8400-e29b-41d4-a716-446655440000', '수학', 'midterm', 'Midterm Exam', '2025-09-15'),
('550e8400-e29b-41d4-a716-446655440000', '탐구', 'final', 'Final Exam', '2025-10-20');

-- Subjects table for managing user subjects
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Create indexes for subjects
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);

-- Create trigger for subjects updated_at
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample subjects
INSERT INTO subjects (user_id, name) VALUES
('550e8400-e29b-41d4-a716-446655440000', '국어'),
('550e8400-e29b-41d4-a716-446655440000', '영어'),
('550e8400-e29b-41d4-a716-446655440000', '수학'),
('550e8400-e29b-41d4-a716-446655440000', '탐구'),
('550e8400-e29b-41d4-a716-446655440000', '한국사')
ON CONFLICT (user_id, name) DO NOTHING;

-- Brain dumps table for storing user's brain dump content
CREATE TABLE IF NOT EXISTS brain_dumps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_completed column if it doesn't exist (for existing databases)
ALTER TABLE brain_dumps ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Create indexes for brain dumps
CREATE INDEX IF NOT EXISTS idx_brain_dumps_user_id ON brain_dumps(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_dumps_created_at ON brain_dumps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_dumps_is_pinned ON brain_dumps(is_pinned);

-- Create trigger for brain dumps updated_at
DROP TRIGGER IF EXISTS update_brain_dumps_updated_at ON brain_dumps;
CREATE TRIGGER update_brain_dumps_updated_at BEFORE UPDATE ON brain_dumps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample brain dumps for test user only
INSERT INTO brain_dumps (user_id, title, content, category, is_pinned) VALUES
('550e8400-e29b-41d4-a716-446655440000', '수능 D-30 계획', '매일 국어 기출 2회독\n영어 단어 100개\n수학 문제집 20문제', '학습계획', true),
('550e8400-e29b-41d4-a716-446655440000', '영어 문법 정리', 'Present Perfect: have/has + p.p\n- 경험, 완료, 계속, 결과\n- since/for 구분하기', '영어', false),
('550e8400-e29b-41d4-a716-446655440000', '수학 공식 모음', '이차방정식: ax² + bx + c = 0\n근의 공식: x = (-b ± √(b²-4ac))/2a', '수학', false)
ON CONFLICT DO NOTHING;

-- Priority tasks table for managing priority tasks
CREATE TABLE IF NOT EXISTS priority_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    order_index INTEGER NOT NULL DEFAULT 1,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for priority tasks
CREATE INDEX IF NOT EXISTS idx_priority_tasks_user_id ON priority_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_priority_tasks_order ON priority_tasks(order_index);

-- Create trigger for priority tasks updated_at
DROP TRIGGER IF EXISTS update_priority_tasks_updated_at ON priority_tasks;
CREATE TRIGGER update_priority_tasks_updated_at BEFORE UPDATE ON priority_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample priority tasks for test user
INSERT INTO priority_tasks (user_id, title, subject, priority, order_index, completed) VALUES
('550e8400-e29b-41d4-a716-446655440000', '아침 조정하기', '일반', 'high', 1, false),
('550e8400-e29b-41d4-a716-446655440000', '2025년 6월 모의고사 풀기', '수학', 'high', 2, false),
('550e8400-e29b-41d4-a716-446655440000', '학원가기', '일반', 'medium', 3, false)
ON CONFLICT DO NOTHING;

-- Sample test results with detailed analysis data
INSERT INTO test_results (test_id, user_id, raw_score, standard_score, percentile, grade, analysis_data)
SELECT
    t.id,
    t.user_id,
    CASE
        WHEN t.test_name = 'Mock Test 1' AND t.subject = '국어' THEN 85
        WHEN t.test_name = 'Mock Test 2' AND t.subject = '국어' THEN 92
        WHEN t.test_name = 'Mock Test 1' AND t.subject = '영어' THEN 78
        WHEN t.test_name = 'Midterm Exam' AND t.subject = '수학' THEN 88
        ELSE 82
    END as raw_score,
    CASE
        WHEN t.test_name = 'Mock Test 1' AND t.subject = '국어' THEN 131
        WHEN t.test_name = 'Mock Test 2' AND t.subject = '국어' THEN 137
        WHEN t.test_name = 'Mock Test 1' AND t.subject = '영어' THEN 125
        WHEN t.test_name = 'Midterm Exam' AND t.subject = '수학' THEN 134
        ELSE 128
    END as standard_score,
    CASE
        WHEN t.test_name = 'Mock Test 1' AND t.subject = '국어' THEN 93
        WHEN t.test_name = 'Mock Test 2' AND t.subject = '국어' THEN 95
        WHEN t.test_name = 'Mock Test 1' AND t.subject = '영어' THEN 87
        WHEN t.test_name = 'Midterm Exam' AND t.subject = '수학' THEN 91
        ELSE 89
    END as percentile,
    CASE
        WHEN t.test_name = 'Mock Test 1' AND t.subject = '국어' THEN 2
        WHEN t.test_name = 'Mock Test 2' AND t.subject = '국어' THEN 2
        WHEN t.test_name = 'Mock Test 1' AND t.subject = '영어' THEN 3
        WHEN t.test_name = 'Midterm Exam' AND t.subject = '수학' THEN 2
        ELSE 2
    END as grade,
    CASE
        WHEN t.test_name = 'Mock Test 1' AND t.subject = '국어' THEN '{"korean": {"rawScore": 85, "standardScore": 131, "percentile": 93, "grade": 2}, "math": {"rawScore": 78, "standardScore": 125, "percentile": 87, "grade": 3}, "english": {"rawScore": 72, "standardScore": 118, "percentile": 82, "grade": 3}}'
        WHEN t.test_name = 'Mock Test 2' AND t.subject = '국어' THEN '{"korean": {"rawScore": 92, "standardScore": 137, "percentile": 95, "grade": 2}, "math": {"rawScore": 88, "standardScore": 135, "percentile": 94, "grade": 2}, "english": {"rawScore": 85, "standardScore": 128, "percentile": 91, "grade": 2}}'
        WHEN t.test_name = 'Mock Test 1' AND t.subject = '영어' THEN '{"english": {"rawScore": 78, "standardScore": 125, "percentile": 87, "grade": 3}, "korean": {"rawScore": 82, "standardScore": 128, "percentile": 89, "grade": 2}}'
        WHEN t.test_name = 'Midterm Exam' AND t.subject = '수학' THEN '{"math": {"rawScore": 88, "standardScore": 134, "percentile": 91, "grade": 2}, "korean": {"rawScore": 85, "standardScore": 131, "percentile": 93, "grade": 2}}'
        ELSE '{"korean": {"rawScore": 82, "standardScore": 128, "percentile": 89, "grade": 2}}'
    END as analysis_data
FROM tests t
WHERE t.user_id = '550e8400-e29b-41d4-a716-446655440000'
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMUNITY FEATURES DATABASE SCHEMA
-- ============================================

-- Study groups table
CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    member_count INTEGER DEFAULT 0,
    max_members INTEGER DEFAULT 50,
    is_public BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Daily posts table
CREATE TABLE IF NOT EXISTS daily_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    study_hours INTEGER,
    subjects_studied TEXT[],
    mood VARCHAR(50),
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add views_count column if it doesn't exist (for existing databases)
ALTER TABLE daily_posts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES daily_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES daily_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    subject VARCHAR(100),
    tags TEXT[],
    image_urls TEXT[],
    views_count INTEGER DEFAULT 0,
    answers_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_solved BOOLEAN DEFAULT FALSE,
    accepted_answer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question likes table
CREATE TABLE IF NOT EXISTS question_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id, user_id)
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_urls TEXT[],
    likes_count INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answer likes table
CREATE TABLE IF NOT EXISTS answer_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(answer_id, user_id)
);

-- Notifications table for real-time updates
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'comment', 'answer', 'mention', 'group_invite', 'group_post')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_id UUID,
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for community tables
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_posts_user_id ON daily_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_posts_group_id ON daily_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_daily_posts_created_at ON daily_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_likes_question_id ON question_likes(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_likes_answer_id ON answer_likes(answer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_study_groups_updated_at ON study_groups;
DROP TRIGGER IF EXISTS update_daily_posts_updated_at ON daily_posts;
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON post_comments;
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
DROP TRIGGER IF EXISTS update_answers_updated_at ON answers;

CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON study_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_posts_updated_at BEFORE UPDATE ON daily_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update member count in study groups
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE study_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE study_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_group_member_count_trigger ON group_members;
CREATE TRIGGER update_group_member_count_trigger
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Function to update counts in posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE daily_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE daily_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON post_likes;
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Function to update comments count in posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE daily_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE daily_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON post_comments;
CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to update likes count in questions
CREATE OR REPLACE FUNCTION update_question_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE questions SET likes_count = likes_count + 1 WHERE id = NEW.question_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE questions SET likes_count = likes_count - 1 WHERE id = OLD.question_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_question_likes_count_trigger ON question_likes;
CREATE TRIGGER update_question_likes_count_trigger
AFTER INSERT OR DELETE ON question_likes
FOR EACH ROW EXECUTE FUNCTION update_question_likes_count();

-- Function to update answers count in questions
CREATE OR REPLACE FUNCTION update_question_answers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE questions SET answers_count = answers_count + 1 WHERE id = NEW.question_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE questions SET answers_count = answers_count - 1 WHERE id = OLD.question_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_question_answers_count_trigger ON answers;
CREATE TRIGGER update_question_answers_count_trigger
AFTER INSERT OR DELETE ON answers
FOR EACH ROW EXECUTE FUNCTION update_question_answers_count();

-- Function to update likes count in answers
CREATE OR REPLACE FUNCTION update_answer_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE answers SET likes_count = likes_count + 1 WHERE id = NEW.answer_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE answers SET likes_count = likes_count - 1 WHERE id = OLD.answer_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_answer_likes_count_trigger ON answer_likes;
CREATE TRIGGER update_answer_likes_count_trigger
AFTER INSERT OR DELETE ON answer_likes
FOR EACH ROW EXECUTE FUNCTION update_answer_likes_count();

-- Enable Row Level Security (RLS) for all community tables
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic public read, authenticated write)
-- Study groups policies
DROP POLICY IF EXISTS "Public read access" ON study_groups;
DROP POLICY IF EXISTS "Public write access" ON study_groups;
CREATE POLICY "Public read access" ON study_groups FOR SELECT USING (true);
CREATE POLICY "Public write access" ON study_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON study_groups FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON study_groups FOR DELETE USING (true);

-- Group members policies
DROP POLICY IF EXISTS "Public read access" ON group_members;
DROP POLICY IF EXISTS "Public write access" ON group_members;
CREATE POLICY "Public read access" ON group_members FOR SELECT USING (true);
CREATE POLICY "Public write access" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON group_members FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON group_members FOR DELETE USING (true);

-- Daily posts policies
DROP POLICY IF EXISTS "Public read access" ON daily_posts;
DROP POLICY IF EXISTS "Public write access" ON daily_posts;
CREATE POLICY "Public read access" ON daily_posts FOR SELECT USING (true);
CREATE POLICY "Public write access" ON daily_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON daily_posts FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON daily_posts FOR DELETE USING (true);

-- Post likes policies
DROP POLICY IF EXISTS "Public read access" ON post_likes;
DROP POLICY IF EXISTS "Public write access" ON post_likes;
CREATE POLICY "Public read access" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Public write access" ON post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON post_likes FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON post_likes FOR DELETE USING (true);

-- Post comments policies
DROP POLICY IF EXISTS "Public read access" ON post_comments;
DROP POLICY IF EXISTS "Public write access" ON post_comments;
CREATE POLICY "Public read access" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Public write access" ON post_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON post_comments FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON post_comments FOR DELETE USING (true);

-- Questions policies
DROP POLICY IF EXISTS "Public read access" ON questions;
DROP POLICY IF EXISTS "Public write access" ON questions;
CREATE POLICY "Public read access" ON questions FOR SELECT USING (true);
CREATE POLICY "Public write access" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON questions FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON questions FOR DELETE USING (true);

-- Question likes policies
DROP POLICY IF EXISTS "Public read access" ON question_likes;
DROP POLICY IF EXISTS "Public write access" ON question_likes;
CREATE POLICY "Public read access" ON question_likes FOR SELECT USING (true);
CREATE POLICY "Public write access" ON question_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON question_likes FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON question_likes FOR DELETE USING (true);

-- Answers policies
DROP POLICY IF EXISTS "Public read access" ON answers;
DROP POLICY IF EXISTS "Public write access" ON answers;
CREATE POLICY "Public read access" ON answers FOR SELECT USING (true);
CREATE POLICY "Public write access" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON answers FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON answers FOR DELETE USING (true);

-- Answer likes policies
DROP POLICY IF EXISTS "Public read access" ON answer_likes;
DROP POLICY IF EXISTS "Public write access" ON answer_likes;
CREATE POLICY "Public read access" ON answer_likes FOR SELECT USING (true);
CREATE POLICY "Public write access" ON answer_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON answer_likes FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON answer_likes FOR DELETE USING (true);

-- Notifications policies
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
DROP POLICY IF EXISTS "Public write access" ON notifications;
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public write access" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON notifications FOR DELETE USING (true);

-- Sample data for test user community features
-- Create sample study groups
INSERT INTO study_groups (id, name, description, subject, created_by) VALUES
('650e8400-e29b-41d4-a716-446655440001', '수능 스터디 그룹', '2025 수능 대비 함께 공부해요!', '종합', '550e8400-e29b-41d4-a716-446655440000'),
('650e8400-e29b-41d4-a716-446655440002', '영어 회화 모임', '매일 영어 회화 연습', '영어', '550e8400-e29b-41d4-a716-446655440000'),
('650e8400-e29b-41d4-a716-446655440003', '수학 문제 풀이', '수학 문제 함께 풀어요', '수학', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- Add test user to groups
INSERT INTO group_members (group_id, user_id, role) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'admin'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'member')
ON CONFLICT DO NOTHING;

-- Sample daily posts
INSERT INTO daily_posts (user_id, group_id, content, study_hours, subjects_studied, mood) VALUES
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440001', '오늘 국어 모의고사 풀었어요! 생각보다 잘 나와서 기분 좋네요 😊', 3, ARRAY['국어'], 'happy'),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440001', '수학 미적분 파트 완료! 내일은 확률과 통계 시작합니다', 4, ARRAY['수학'], 'focused'),
('550e8400-e29b-41d4-a716-446655440000', NULL, '영어 단어 200개 외웠어요. 힘들지만 보람있네요', 2, ARRAY['영어'], 'tired')
ON CONFLICT DO NOTHING;

-- Sample questions
INSERT INTO questions (user_id, title, content, subject, tags) VALUES
('550e8400-e29b-41d4-a716-446655440000', '이차방정식 문제 질문입니다', '이 문제 어떻게 푸는지 알려주세요. x² + 5x + 6 = 0', '수학', ARRAY['이차방정식', '인수분해']),
('550e8400-e29b-41d4-a716-446655440000', '영어 문법 to부정사 vs 동명사', 'stop to do와 stop doing의 차이가 뭔가요?', '영어', ARRAY['문법', 'to부정사', '동명사']),
('550e8400-e29b-41d4-a716-446655440000', '국어 비문학 독해 팁', '비문학 지문 빨리 읽는 방법 있나요?', '국어', ARRAY['비문학', '독해', '수능'])
ON CONFLICT DO NOTHING;

-- ============================================
-- TIMER SESSIONS DATABASE SCHEMA
-- ============================================

-- Timer sessions table for storing study timer data
CREATE TABLE IF NOT EXISTS timer_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    duration INTEGER NOT NULL, -- in seconds
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE,
    is_paused BOOLEAN DEFAULT FALSE,
    pause_duration INTEGER DEFAULT 0, -- total pause time in seconds
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timer pause logs for tracking pause/resume events
CREATE TABLE IF NOT EXISTS timer_pause_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES timer_sessions(id) ON DELETE CASCADE,
    pause_time TIMESTAMP WITH TIME ZONE NOT NULL,
    resume_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for timer tables
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_start_time ON timer_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_subject ON timer_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_timer_pause_logs_session_id ON timer_pause_logs(session_id);

-- Create triggers for timer updated_at
DROP TRIGGER IF EXISTS update_timer_sessions_updated_at ON timer_sessions;
CREATE TRIGGER update_timer_sessions_updated_at BEFORE UPDATE ON timer_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for timer tables
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_pause_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for timer tables
DROP POLICY IF EXISTS "Public read access" ON timer_sessions;
DROP POLICY IF EXISTS "Public write access" ON timer_sessions;
CREATE POLICY "Public read access" ON timer_sessions FOR SELECT USING (true);
CREATE POLICY "Public write access" ON timer_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON timer_sessions FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON timer_sessions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read access" ON timer_pause_logs;
DROP POLICY IF EXISTS "Public write access" ON timer_pause_logs;
CREATE POLICY "Public read access" ON timer_pause_logs FOR SELECT USING (true);
CREATE POLICY "Public write access" ON timer_pause_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON timer_pause_logs FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON timer_pause_logs FOR DELETE USING (true);