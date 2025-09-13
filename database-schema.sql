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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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