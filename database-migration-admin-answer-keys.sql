-- ============================================
-- ADMIN ANSWER KEY MANAGEMENT DATABASE MIGRATION
-- ============================================
-- Run this SQL in your Supabase SQL Editor to add admin answer key functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add admin role to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin', 'teacher'));

-- Answer key templates table for storing master answer keys
CREATE TABLE IF NOT EXISTS answer_key_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL CHECK (subject IN ('korean', 'mathematics', 'english', 'others')),
    test_type VARCHAR(50) DEFAULT 'practice' CHECK (test_type IN ('practice', 'mock', 'midterm', 'final')),
    total_questions INTEGER NOT NULL,
    mcq_questions INTEGER NOT NULL DEFAULT 0,
    text_questions INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_name, subject, test_type)
);

-- Answer key responses table for storing correct answers
CREATE TABLE IF NOT EXISTS answer_key_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_key_id UUID NOT NULL REFERENCES answer_key_templates(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_type VARCHAR(10) NOT NULL CHECK (question_type IN ('mcq', 'text')),
    correct_mcq_option INTEGER CHECK (correct_mcq_option >= 1 AND correct_mcq_option <= 5), -- for MCQ correct answers (1-5)
    correct_text_answers TEXT[], -- array of acceptable text answers
    points_value DECIMAL(5,2) DEFAULT 1.0, -- points for this question
    explanation TEXT, -- explanation for the correct answer
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(answer_key_id, question_number)
);

-- Answer key categories table for organizing answer keys
CREATE TABLE IF NOT EXISTS answer_key_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007AFF',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for answer key template categories
CREATE TABLE IF NOT EXISTS answer_key_template_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_key_id UUID NOT NULL REFERENCES answer_key_templates(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES answer_key_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(answer_key_id, category_id)
);

-- Answer key usage logs for tracking which answer keys are used for grading
CREATE TABLE IF NOT EXISTS answer_key_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_key_id UUID NOT NULL REFERENCES answer_key_templates(id) ON DELETE CASCADE,
    answer_sheet_id UUID NOT NULL REFERENCES answer_sheets(id) ON DELETE CASCADE,
    graded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_score DECIMAL(8,2),
    max_possible_score DECIMAL(8,2),
    percentage_score DECIMAL(5,2),
    grade_letter VARCHAR(10),
    grading_notes TEXT,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(answer_sheet_id) -- Each answer sheet can only be graded once
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_answer_key_templates_created_by ON answer_key_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_answer_key_templates_subject ON answer_key_templates(subject);
CREATE INDEX IF NOT EXISTS idx_answer_key_templates_test_type ON answer_key_templates(test_type);
CREATE INDEX IF NOT EXISTS idx_answer_key_templates_is_active ON answer_key_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_answer_key_templates_created_at ON answer_key_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answer_key_responses_answer_key_id ON answer_key_responses(answer_key_id);
CREATE INDEX IF NOT EXISTS idx_answer_key_responses_question_number ON answer_key_responses(question_number);
CREATE INDEX IF NOT EXISTS idx_answer_key_template_categories_answer_key_id ON answer_key_template_categories(answer_key_id);
CREATE INDEX IF NOT EXISTS idx_answer_key_template_categories_category_id ON answer_key_template_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_answer_key_usage_logs_answer_key_id ON answer_key_usage_logs(answer_key_id);
CREATE INDEX IF NOT EXISTS idx_answer_key_usage_logs_answer_sheet_id ON answer_key_usage_logs(answer_sheet_id);
CREATE INDEX IF NOT EXISTS idx_answer_key_usage_logs_graded_by ON answer_key_usage_logs(graded_by);
CREATE INDEX IF NOT EXISTS idx_answer_key_usage_logs_graded_at ON answer_key_usage_logs(graded_at DESC);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_answer_key_templates_updated_at ON answer_key_templates;
DROP TRIGGER IF EXISTS update_answer_key_responses_updated_at ON answer_key_responses;

CREATE TRIGGER update_answer_key_templates_updated_at
    BEFORE UPDATE ON answer_key_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answer_key_responses_updated_at
    BEFORE UPDATE ON answer_key_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE answer_key_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_key_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_key_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_key_template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_key_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for answer key templates (admin only for write, public read)
DROP POLICY IF EXISTS "Public read access" ON answer_key_templates;
DROP POLICY IF EXISTS "Admin write access" ON answer_key_templates;
DROP POLICY IF EXISTS "Admin update access" ON answer_key_templates;
DROP POLICY IF EXISTS "Admin delete access" ON answer_key_templates;

CREATE POLICY "Public read access" ON answer_key_templates FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON answer_key_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update access" ON answer_key_templates FOR UPDATE USING (true);
CREATE POLICY "Admin delete access" ON answer_key_templates FOR DELETE USING (true);

-- Create RLS policies for answer key responses
DROP POLICY IF EXISTS "Public read access" ON answer_key_responses;
DROP POLICY IF EXISTS "Admin write access" ON answer_key_responses;
DROP POLICY IF EXISTS "Admin update access" ON answer_key_responses;
DROP POLICY IF EXISTS "Admin delete access" ON answer_key_responses;

CREATE POLICY "Public read access" ON answer_key_responses FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON answer_key_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update access" ON answer_key_responses FOR UPDATE USING (true);
CREATE POLICY "Admin delete access" ON answer_key_responses FOR DELETE USING (true);

-- Create RLS policies for answer key categories
DROP POLICY IF EXISTS "Public read access" ON answer_key_categories;
DROP POLICY IF EXISTS "Admin write access" ON answer_key_categories;
DROP POLICY IF EXISTS "Admin update access" ON answer_key_categories;
DROP POLICY IF EXISTS "Admin delete access" ON answer_key_categories;

CREATE POLICY "Public read access" ON answer_key_categories FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON answer_key_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update access" ON answer_key_categories FOR UPDATE USING (true);
CREATE POLICY "Admin delete access" ON answer_key_categories FOR DELETE USING (true);

-- Create RLS policies for answer key template categories
DROP POLICY IF EXISTS "Public read access" ON answer_key_template_categories;
DROP POLICY IF EXISTS "Admin write access" ON answer_key_template_categories;
DROP POLICY IF EXISTS "Admin update access" ON answer_key_template_categories;
DROP POLICY IF EXISTS "Admin delete access" ON answer_key_template_categories;

CREATE POLICY "Public read access" ON answer_key_template_categories FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON answer_key_template_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update access" ON answer_key_template_categories FOR UPDATE USING (true);
CREATE POLICY "Admin delete access" ON answer_key_template_categories FOR DELETE USING (true);

-- Create RLS policies for answer key usage logs
DROP POLICY IF EXISTS "Public read access" ON answer_key_usage_logs;
DROP POLICY IF EXISTS "Admin write access" ON answer_key_usage_logs;
DROP POLICY IF EXISTS "Admin update access" ON answer_key_usage_logs;
DROP POLICY IF EXISTS "Admin delete access" ON answer_key_usage_logs;

CREATE POLICY "Public read access" ON answer_key_usage_logs FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON answer_key_usage_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update access" ON answer_key_usage_logs FOR UPDATE USING (true);
CREATE POLICY "Admin delete access" ON answer_key_usage_logs FOR DELETE USING (true);

-- Insert default answer key categories
INSERT INTO answer_key_categories (name, description, color) VALUES
('수능 모의고사', 'College Scholastic Ability Test Mock Exams', '#FF3B30'),
('중간고사', 'Midterm Examinations', '#007AFF'),
('기말고사', 'Final Examinations', '#34C759'),
('단원평가', 'Unit Assessments', '#FF9500'),
('진단평가', 'Diagnostic Tests', '#AF52DE'),
('실력평가', 'Achievement Tests', '#FF2D92')
ON CONFLICT (name) DO NOTHING;

-- Make the test user an admin for testing purposes
UPDATE users SET role = 'admin' WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Insert sample answer key templates
INSERT INTO answer_key_templates (created_by, template_name, subject, test_type, total_questions, mcq_questions, text_questions, description) VALUES
('550e8400-e29b-41d4-a716-446655440000', '2025 수능 국어 모의고사 1회', 'korean', 'mock', 45, 34, 11, '2025학년도 수능 대비 국어 모의고사 1회차 정답지'),
('550e8400-e29b-41d4-a716-446655440000', '2025 수능 수학 모의고사 1회', 'mathematics', 'mock', 30, 30, 0, '2025학년도 수능 대비 수학 모의고사 1회차 정답지'),
('550e8400-e29b-41d4-a716-446655440000', '2025 수능 영어 모의고사 1회', 'english', 'mock', 45, 45, 0, '2025학년도 수능 대비 영어 모의고사 1회차 정답지'),
('550e8400-e29b-41d4-a716-446655440000', '기타 과목 중간고사', 'others', 'midterm', 20, 20, 0, '기타 과목 중간고사 정답지')
ON CONFLICT (template_name, subject, test_type) DO NOTHING;

-- Insert sample answer key responses
DO $$
DECLARE
    korean_key_id UUID;
    math_key_id UUID;
    english_key_id UUID;
    others_key_id UUID;
    i INTEGER;
BEGIN
    -- Get the answer key IDs
    SELECT id INTO korean_key_id FROM answer_key_templates WHERE template_name = '2025 수능 국어 모의고사 1회' LIMIT 1;
    SELECT id INTO math_key_id FROM answer_key_templates WHERE template_name = '2025 수능 수학 모의고사 1회' LIMIT 1;
    SELECT id INTO english_key_id FROM answer_key_templates WHERE template_name = '2025 수능 영어 모의고사 1회' LIMIT 1;
    SELECT id INTO others_key_id FROM answer_key_templates WHERE template_name = '기타 과목 중간고사' LIMIT 1;

    -- Insert Korean MCQ answers (questions 1-34)
    IF korean_key_id IS NOT NULL THEN
        FOR i IN 1..34 LOOP
            INSERT INTO answer_key_responses (answer_key_id, question_number, question_type, correct_mcq_option, points_value, difficulty_level) VALUES
            (korean_key_id, i, 'mcq', 
                CASE 
                    WHEN i % 5 = 1 THEN 1
                    WHEN i % 5 = 2 THEN 2
                    WHEN i % 5 = 3 THEN 3
                    WHEN i % 5 = 4 THEN 4
                    ELSE 5
                END, 
                2.0,
                CASE 
                    WHEN i <= 10 THEN 'easy'
                    WHEN i <= 25 THEN 'medium'
                    ELSE 'hard'
                END
            )
            ON CONFLICT (answer_key_id, question_number) DO NOTHING;
        END LOOP;

        -- Insert Korean text answers (questions 35-45)
        FOR i IN 35..45 LOOP
            INSERT INTO answer_key_responses (answer_key_id, question_number, question_type, correct_text_answers, points_value, difficulty_level, explanation) VALUES
            (korean_key_id, i, 'text', 
                ARRAY['정답 예시 ' || i, '모범답안 ' || i, '올바른 답 ' || i], 
                3.0, 
                'hard',
                '문제 ' || i || '번의 정답 해설입니다. 이 문제는 문학/비문학 독해 능력을 평가합니다.'
            )
            ON CONFLICT (answer_key_id, question_number) DO NOTHING;
        END LOOP;
    END IF;

    -- Insert Math MCQ answers (questions 1-30)
    IF math_key_id IS NOT NULL THEN
        FOR i IN 1..30 LOOP
            INSERT INTO answer_key_responses (answer_key_id, question_number, question_type, correct_mcq_option, points_value, difficulty_level, explanation) VALUES
            (math_key_id, i, 'mcq', 
                CASE 
                    WHEN i % 5 = 1 THEN 3
                    WHEN i % 5 = 2 THEN 1
                    WHEN i % 5 = 3 THEN 4
                    WHEN i % 5 = 4 THEN 2
                    ELSE 5
                END, 
                4.0,
                CASE 
                    WHEN i <= 8 THEN 'easy'
                    WHEN i <= 20 THEN 'medium'
                    ELSE 'hard'
                END,
                '수학 문제 ' || i || '번의 해설입니다. 이 문제는 ' || 
                CASE 
                    WHEN i <= 10 THEN '기본 개념'
                    WHEN i <= 20 THEN '응용 문제'
                    ELSE '고난도 문제'
                END || '를 다룹니다.'
            )
            ON CONFLICT (answer_key_id, question_number) DO NOTHING;
        END LOOP;
    END IF;

    -- Insert English MCQ answers (questions 1-45)
    IF english_key_id IS NOT NULL THEN
        FOR i IN 1..45 LOOP
            INSERT INTO answer_key_responses (answer_key_id, question_number, question_type, correct_mcq_option, points_value, difficulty_level) VALUES
            (english_key_id, i, 'mcq', 
                CASE 
                    WHEN i % 5 = 1 THEN 2
                    WHEN i % 5 = 2 THEN 4
                    WHEN i % 5 = 3 THEN 1
                    WHEN i % 5 = 4 THEN 5
                    ELSE 3
                END, 
                2.0,
                CASE 
                    WHEN i <= 15 THEN 'easy'
                    WHEN i <= 35 THEN 'medium'
                    ELSE 'hard'
                END
            )
            ON CONFLICT (answer_key_id, question_number) DO NOTHING;
        END LOOP;
    END IF;

    -- Insert Others MCQ answers (questions 1-20)
    IF others_key_id IS NOT NULL THEN
        FOR i IN 1..20 LOOP
            INSERT INTO answer_key_responses (answer_key_id, question_number, question_type, correct_mcq_option, points_value, difficulty_level) VALUES
            (others_key_id, i, 'mcq', 
                CASE 
                    WHEN i % 4 = 1 THEN 1
                    WHEN i % 4 = 2 THEN 3
                    WHEN i % 4 = 3 THEN 2
                    ELSE 4
                END, 
                5.0,
                'medium'
            )
            ON CONFLICT (answer_key_id, question_number) DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- Link answer keys to categories
DO $$
DECLARE
    korean_key_id UUID;
    math_key_id UUID;
    english_key_id UUID;
    others_key_id UUID;
    mock_category_id UUID;
    midterm_category_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO korean_key_id FROM answer_key_templates WHERE template_name = '2025 수능 국어 모의고사 1회' LIMIT 1;
    SELECT id INTO math_key_id FROM answer_key_templates WHERE template_name = '2025 수능 수학 모의고사 1회' LIMIT 1;
    SELECT id INTO english_key_id FROM answer_key_templates WHERE template_name = '2025 수능 영어 모의고사 1회' LIMIT 1;
    SELECT id INTO others_key_id FROM answer_key_templates WHERE template_name = '기타 과목 중간고사' LIMIT 1;
    SELECT id INTO mock_category_id FROM answer_key_categories WHERE name = '수능 모의고사' LIMIT 1;
    SELECT id INTO midterm_category_id FROM answer_key_categories WHERE name = '중간고사' LIMIT 1;

    -- Link mock exams to mock category
    IF korean_key_id IS NOT NULL AND mock_category_id IS NOT NULL THEN
        INSERT INTO answer_key_template_categories (answer_key_id, category_id) VALUES (korean_key_id, mock_category_id) ON CONFLICT DO NOTHING;
    END IF;
    IF math_key_id IS NOT NULL AND mock_category_id IS NOT NULL THEN
        INSERT INTO answer_key_template_categories (answer_key_id, category_id) VALUES (math_key_id, mock_category_id) ON CONFLICT DO NOTHING;
    END IF;
    IF english_key_id IS NOT NULL AND mock_category_id IS NOT NULL THEN
        INSERT INTO answer_key_template_categories (answer_key_id, category_id) VALUES (english_key_id, mock_category_id) ON CONFLICT DO NOTHING;
    END IF;
    
    -- Link midterm exam to midterm category
    IF others_key_id IS NOT NULL AND midterm_category_id IS NOT NULL THEN
        INSERT INTO answer_key_template_categories (answer_key_id, category_id) VALUES (others_key_id, midterm_category_id) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Function to automatically grade an answer sheet using an answer key
CREATE OR REPLACE FUNCTION auto_grade_answer_sheet(
    p_answer_sheet_id UUID,
    p_answer_key_id UUID,
    p_graded_by UUID
)
RETURNS TABLE (
    total_score DECIMAL(8,2),
    max_possible_score DECIMAL(8,2),
    percentage_score DECIMAL(5,2),
    grade_letter VARCHAR(10),
    grading_success BOOLEAN
) AS $$
DECLARE
    v_total_score DECIMAL(8,2) := 0;
    v_max_possible_score DECIMAL(8,2) := 0;
    v_percentage DECIMAL(5,2);
    v_grade_letter VARCHAR(10);
    response_record RECORD;
    key_record RECORD;
BEGIN
    -- Calculate max possible score
    SELECT COALESCE(SUM(points_value), 0) INTO v_max_possible_score
    FROM answer_key_responses
    WHERE answer_key_id = p_answer_key_id;

    -- Grade each response
    FOR response_record IN
        SELECT * FROM answer_sheet_responses WHERE answer_sheet_id = p_answer_sheet_id
    LOOP
        -- Get the corresponding answer key
        SELECT * INTO key_record
        FROM answer_key_responses
        WHERE answer_key_id = p_answer_key_id
        AND question_number = response_record.question_number;

        IF FOUND THEN
            IF response_record.question_type = 'mcq' AND key_record.question_type = 'mcq' THEN
                -- Grade MCQ question
                IF response_record.mcq_option = key_record.correct_mcq_option THEN
                    v_total_score := v_total_score + key_record.points_value;
                    
                    -- Update the response as correct
                    UPDATE answer_sheet_responses
                    SET is_correct = true, points_earned = key_record.points_value
                    WHERE id = response_record.id;
                ELSE
                    -- Update the response as incorrect
                    UPDATE answer_sheet_responses
                    SET is_correct = false, points_earned = 0
                    WHERE id = response_record.id;
                END IF;
            ELSIF response_record.question_type = 'text' AND key_record.question_type = 'text' THEN
                -- Grade text question (basic matching for now)
                IF response_record.text_answer IS NOT NULL AND 
                   key_record.correct_text_answers IS NOT NULL AND 
                   response_record.text_answer = ANY(key_record.correct_text_answers) THEN
                    v_total_score := v_total_score + key_record.points_value;
                    
                    -- Update the response as correct
                    UPDATE answer_sheet_responses
                    SET is_correct = true, points_earned = key_record.points_value
                    WHERE id = response_record.id;
                ELSE
                    -- Update the response as incorrect (manual review needed for text)
                    UPDATE answer_sheet_responses
                    SET is_correct = false, points_earned = 0
                    WHERE id = response_record.id;
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- Calculate percentage and grade
    IF v_max_possible_score > 0 THEN
        v_percentage := ROUND((v_total_score / v_max_possible_score) * 100, 2);
    ELSE
        v_percentage := 0;
    END IF;

    -- Assign grade letter based on percentage (Korean grading system)
    v_grade_letter := CASE
        WHEN v_percentage >= 96 THEN '1등급'
        WHEN v_percentage >= 89 THEN '2등급'
        WHEN v_percentage >= 77 THEN '3등급'
        WHEN v_percentage >= 64 THEN '4등급'
        WHEN v_percentage >= 50 THEN '5등급'
        WHEN v_percentage >= 40 THEN '6등급'
        WHEN v_percentage >= 30 THEN '7등급'
        WHEN v_percentage >= 20 THEN '8등급'
        ELSE '9등급'
    END;

    -- Update the answer sheet with final score and grade
    UPDATE answer_sheets
    SET score = v_total_score::INTEGER, grade = v_grade_letter, status = 'graded'
    WHERE id = p_answer_sheet_id;

    -- Log the grading activity
    INSERT INTO answer_key_usage_logs (
        answer_key_id, answer_sheet_id, graded_by, total_score, 
        max_possible_score, percentage_score, grade_letter
    ) VALUES (
        p_answer_key_id, p_answer_sheet_id, p_graded_by, v_total_score,
        v_max_possible_score, v_percentage, v_grade_letter
    ) ON CONFLICT (answer_sheet_id) DO UPDATE SET
        answer_key_id = EXCLUDED.answer_key_id,
        graded_by = EXCLUDED.graded_by,
        total_score = EXCLUDED.total_score,
        max_possible_score = EXCLUDED.max_possible_score,
        percentage_score = EXCLUDED.percentage_score,
        grade_letter = EXCLUDED.grade_letter,
        graded_at = NOW();

    -- Return results
    RETURN QUERY SELECT v_total_score, v_max_possible_score, v_percentage, v_grade_letter, true;
END;
$$ LANGUAGE plpgsql;

-- Function to get answer key statistics
CREATE OR REPLACE FUNCTION get_answer_key_stats(p_answer_key_id UUID)
RETURNS TABLE (
    total_questions INTEGER,
    mcq_questions INTEGER,
    text_questions INTEGER,
    total_points DECIMAL(8,2),
    avg_difficulty VARCHAR(20),
    usage_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_questions,
        COUNT(CASE WHEN question_type = 'mcq' THEN 1 END)::INTEGER as mcq_questions,
        COUNT(CASE WHEN question_type = 'text' THEN 1 END)::INTEGER as text_questions,
        COALESCE(SUM(points_value), 0) as total_points,
        CASE
            WHEN AVG(CASE difficulty_level WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 END) < 1.5 THEN 'easy'
            WHEN AVG(CASE difficulty_level WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 END) < 2.5 THEN 'medium'
            ELSE 'hard'
        END as avg_difficulty,
        (SELECT COUNT(*)::INTEGER FROM answer_key_usage_logs WHERE answer_key_id = p_answer_key_id) as usage_count
    FROM answer_key_responses
    WHERE answer_key_id = p_answer_key_id;
END;
$$ LANGUAGE plpgsql;

-- Create a view for answer key summary with statistics
CREATE OR REPLACE VIEW answer_key_summary AS
SELECT
    akt.id,
    akt.created_by,
    u.name as creator_name,
    akt.template_name,
    akt.subject,
    akt.test_type,
    akt.total_questions,
    akt.mcq_questions,
    akt.text_questions,
    akt.description,
    akt.is_active,
    akt.created_at,
    akt.updated_at,
    COUNT(akr.id) as configured_questions,
    COALESCE(SUM(akr.points_value), 0) as total_points,
    COUNT(akul.id) as usage_count,
    ARRAY_AGG(DISTINCT akc.name) FILTER (WHERE akc.name IS NOT NULL) as categories
FROM answer_key_templates akt
LEFT JOIN users u ON akt.created_by = u.id
LEFT JOIN answer_key_responses akr ON akt.id = akr.answer_key_id
LEFT JOIN answer_key_usage_logs akul ON akt.id = akul.answer_key_id
LEFT JOIN answer_key_template_categories aktc ON akt.id = aktc.answer_key_id
LEFT JOIN answer_key_categories akc ON aktc.category_id = akc.id
GROUP BY akt.id, akt.created_by, u.name, akt.template_name, akt.subject, akt.test_type,
         akt.total_questions, akt.mcq_questions, akt.text_questions, akt.description,
         akt.is_active, akt.created_at, akt.updated_at;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON answer_key_templates TO authenticated;
-- GRANT ALL ON answer_key_responses TO authenticated;
-- GRANT ALL ON answer_key_categories TO authenticated;
-- GRANT ALL ON answer_key_template_categories TO authenticated;
-- GRANT ALL ON answer_key_usage_logs TO authenticated;
-- GRANT SELECT ON answer_key_summary TO authenticated;