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

-- Create triggers for updated_at
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

-- Sample study sessions
INSERT INTO study_sessions (user_id, subject, duration, date) VALUES 
('550e8400-e29b-41d4-a716-446655440000', '국어', 120, '2025-08-30'),
('550e8400-e29b-41d4-a716-446655440000', '영어', 90, '2025-08-30'),
('550e8400-e29b-41d4-a716-446655440000', '수학', 150, '2025-08-29');