-- ============================================
-- ANSWER SHEETS DATABASE MIGRATION
-- ============================================
-- Run this SQL in your Supabase SQL Editor to add answer sheet functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Answer sheets table for storing answer sheet metadata
CREATE TABLE IF NOT EXISTS answer_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL CHECK (subject IN ('korean', 'mathematics', 'english', 'others')),
    sheet_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) DEFAULT 'practice' CHECK (test_type IN ('practice', 'mock', 'midterm', 'final')),
    total_questions INTEGER NOT NULL,
    mcq_questions INTEGER NOT NULL DEFAULT 0,
    text_questions INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    score INTEGER, -- raw score if graded
    grade VARCHAR(10), -- letter grade if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answer sheet responses table for storing individual answers
CREATE TABLE IF NOT EXISTS answer_sheet_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_sheet_id UUID NOT NULL REFERENCES answer_sheets(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_type VARCHAR(10) NOT NULL CHECK (question_type IN ('mcq', 'text')),
    mcq_option INTEGER CHECK (mcq_option >= 1 AND mcq_option <= 5), -- for MCQ answers (1-5)
    text_answer TEXT, -- for text/essay answers
    is_correct BOOLEAN, -- for graded answers
    points_earned DECIMAL(5,2), -- points earned for this question
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(answer_sheet_id, question_number)
);

-- Answer sheet templates table for storing question configurations
CREATE TABLE IF NOT EXISTS answer_sheet_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject VARCHAR(100) NOT NULL CHECK (subject IN ('korean', 'mathematics', 'english', 'others')),
    template_name VARCHAR(255) NOT NULL,
    total_questions INTEGER NOT NULL,
    mcq_questions INTEGER NOT NULL DEFAULT 0,
    text_questions INTEGER NOT NULL DEFAULT 0,
    question_config JSONB, -- stores question structure like {"1-34": "mcq", "35-45": "text"}
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject, template_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_answer_sheets_user_id ON answer_sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_sheets_subject ON answer_sheets(subject);
CREATE INDEX IF NOT EXISTS idx_answer_sheets_status ON answer_sheets(status);
CREATE INDEX IF NOT EXISTS idx_answer_sheets_created_at ON answer_sheets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answer_sheet_responses_sheet_id ON answer_sheet_responses(answer_sheet_id);
CREATE INDEX IF NOT EXISTS idx_answer_sheet_responses_question_number ON answer_sheet_responses(question_number);
CREATE INDEX IF NOT EXISTS idx_answer_sheet_templates_subject ON answer_sheet_templates(subject);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_answer_sheets_updated_at ON answer_sheets;
DROP TRIGGER IF EXISTS update_answer_sheet_responses_updated_at ON answer_sheet_responses;
DROP TRIGGER IF EXISTS update_answer_sheet_templates_updated_at ON answer_sheet_templates;

CREATE TRIGGER update_answer_sheets_updated_at 
    BEFORE UPDATE ON answer_sheets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answer_sheet_responses_updated_at 
    BEFORE UPDATE ON answer_sheet_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answer_sheet_templates_updated_at 
    BEFORE UPDATE ON answer_sheet_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE answer_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_sheet_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_sheet_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for answer sheets
DROP POLICY IF EXISTS "Public read access" ON answer_sheets;
DROP POLICY IF EXISTS "Public write access" ON answer_sheets;
DROP POLICY IF EXISTS "Public update access" ON answer_sheets;
DROP POLICY IF EXISTS "Public delete access" ON answer_sheets;

CREATE POLICY "Public read access" ON answer_sheets FOR SELECT USING (true);
CREATE POLICY "Public write access" ON answer_sheets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON answer_sheets FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON answer_sheets FOR DELETE USING (true);

-- Create RLS policies for answer sheet responses
DROP POLICY IF EXISTS "Public read access" ON answer_sheet_responses;
DROP POLICY IF EXISTS "Public write access" ON answer_sheet_responses;
DROP POLICY IF EXISTS "Public update access" ON answer_sheet_responses;
DROP POLICY IF EXISTS "Public delete access" ON answer_sheet_responses;

CREATE POLICY "Public read access" ON answer_sheet_responses FOR SELECT USING (true);
CREATE POLICY "Public write access" ON answer_sheet_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON answer_sheet_responses FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON answer_sheet_responses FOR DELETE USING (true);

-- Create RLS policies for answer sheet templates
DROP POLICY IF EXISTS "Public read access" ON answer_sheet_templates;
DROP POLICY IF EXISTS "Public write access" ON answer_sheet_templates;
DROP POLICY IF EXISTS "Public update access" ON answer_sheet_templates;
DROP POLICY IF EXISTS "Public delete access" ON answer_sheet_templates;

CREATE POLICY "Public read access" ON answer_sheet_templates FOR SELECT USING (true);
CREATE POLICY "Public write access" ON answer_sheet_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON answer_sheet_templates FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON answer_sheet_templates FOR DELETE USING (true);

-- Insert default answer sheet templates based on the current answer sheet configurations
INSERT INTO answer_sheet_templates (subject, template_name, total_questions, mcq_questions, text_questions, question_config, is_default) VALUES
('korean', 'Standard Korean Test', 45, 34, 11, '{"1-34": "mcq", "35-45": "text"}', true),
('mathematics', 'Standard Mathematics Test', 30, 30, 0, '{"1-30": "mcq"}', true),
('english', 'Standard English Test', 45, 45, 0, '{"1-45": "mcq"}', true),
('others', 'Standard Others Test', 20, 20, 0, '{"1-20": "mcq"}', true)
ON CONFLICT (subject, template_name) DO NOTHING;

-- Sample data for testing (using the existing test user)
-- Create sample answer sheets for the test user
INSERT INTO answer_sheets (user_id, subject, sheet_name, test_type, total_questions, mcq_questions, text_questions, status) VALUES
('bdfd8c34-a28f-4101-97e0-894c3fa5c7a6', 'korean', 'Korean Practice Test 1', 'practice', 45, 34, 11, 'draft'),
('bdfd8c34-a28f-4101-97e0-894c3fa5c7a6', 'mathematics', 'Math Mock Exam', 'mock', 30, 30, 0, 'submitted'),
('bdfd8c34-a28f-4101-97e0-894c3fa5c7a6', 'english', 'English Midterm', 'midterm', 45, 45, 0, 'graded')
ON CONFLICT DO NOTHING;

-- Sample answer sheet responses for the test user
-- Get the answer sheet IDs for sample responses
DO $$
DECLARE
    korean_sheet_id UUID;
    math_sheet_id UUID;
    english_sheet_id UUID;
BEGIN
    -- Get the Korean sheet ID
    SELECT id INTO korean_sheet_id FROM answer_sheets 
    WHERE user_id = 'bdfd8c34-a28f-4101-97e0-894c3fa5c7a6' AND subject = 'korean' LIMIT 1;
    
    -- Get the Math sheet ID
    SELECT id INTO math_sheet_id FROM answer_sheets 
    WHERE user_id = 'bdfd8c34-a28f-4101-97e0-894c3fa5c7a6' AND subject = 'mathematics' LIMIT 1;
    
    -- Get the English sheet ID
    SELECT id INTO english_sheet_id FROM answer_sheets 
    WHERE user_id = 'bdfd8c34-a28f-4101-97e0-894c3fa5c7a6' AND subject = 'english' LIMIT 1;
    
    -- Insert sample MCQ responses for Korean (questions 1-10)
    IF korean_sheet_id IS NOT NULL THEN
        INSERT INTO answer_sheet_responses (answer_sheet_id, question_number, question_type, mcq_option) VALUES
        (korean_sheet_id, 1, 'mcq', 2),
        (korean_sheet_id, 2, 'mcq', 1),
        (korean_sheet_id, 3, 'mcq', 4),
        (korean_sheet_id, 4, 'mcq', 3),
        (korean_sheet_id, 5, 'mcq', 2)
        ON CONFLICT (answer_sheet_id, question_number) DO NOTHING;
        
        -- Insert sample text responses for Korean (questions 35-37)
        INSERT INTO answer_sheet_responses (answer_sheet_id, question_number, question_type, text_answer) VALUES
        (korean_sheet_id, 35, 'text', '이 문제의 답은 작가의 의도를 파악하는 것입니다. 주인공의 심리 변화를 통해...'),
        (korean_sheet_id, 36, 'text', '비유법의 효과는 독자의 이해를 돕고 감정적 몰입을 증대시키는 것입니다.'),
        (korean_sheet_id, 37, 'text', '화자의 정서는 그리움과 아쉬움이 복합적으로 나타나고 있습니다.')
        ON CONFLICT (answer_sheet_id, question_number) DO NOTHING;
    END IF;
    
    -- Insert sample MCQ responses for Math (questions 1-10)
    IF math_sheet_id IS NOT NULL THEN
        INSERT INTO answer_sheet_responses (answer_sheet_id, question_number, question_type, mcq_option, is_correct, points_earned) VALUES
        (math_sheet_id, 1, 'mcq', 3, true, 4.0),
        (math_sheet_id, 2, 'mcq', 2, false, 0.0),
        (math_sheet_id, 3, 'mcq', 1, true, 4.0),
        (math_sheet_id, 4, 'mcq', 4, true, 4.0),
        (math_sheet_id, 5, 'mcq', 2, true, 4.0),
        (math_sheet_id, 6, 'mcq', 3, false, 0.0),
        (math_sheet_id, 7, 'mcq', 1, true, 4.0),
        (math_sheet_id, 8, 'mcq', 5, true, 4.0),
        (math_sheet_id, 9, 'mcq', 2, false, 0.0),
        (math_sheet_id, 10, 'mcq', 4, true, 4.0)
        ON CONFLICT (answer_sheet_id, question_number) DO NOTHING;
        
        -- Update the math sheet with score and grade
        UPDATE answer_sheets 
        SET score = 28, grade = '2등급', submitted_at = NOW() - INTERVAL '2 days'
        WHERE id = math_sheet_id;
    END IF;
    
    -- Insert sample MCQ responses for English (questions 1-10)
    IF english_sheet_id IS NOT NULL THEN
        INSERT INTO answer_sheet_responses (answer_sheet_id, question_number, question_type, mcq_option, is_correct, points_earned) VALUES
        (english_sheet_id, 1, 'mcq', 1, true, 2.0),
        (english_sheet_id, 2, 'mcq', 3, true, 2.0),
        (english_sheet_id, 3, 'mcq', 2, false, 0.0),
        (english_sheet_id, 4, 'mcq', 4, true, 2.0),
        (english_sheet_id, 5, 'mcq', 1, true, 2.0),
        (english_sheet_id, 6, 'mcq', 5, false, 0.0),
        (english_sheet_id, 7, 'mcq', 2, true, 2.0),
        (english_sheet_id, 8, 'mcq', 3, true, 2.0),
        (english_sheet_id, 9, 'mcq', 1, false, 0.0),
        (english_sheet_id, 10, 'mcq', 4, true, 2.0)
        ON CONFLICT (answer_sheet_id, question_number) DO NOTHING;
        
        -- Update the English sheet with score and grade
        UPDATE answer_sheets 
        SET score = 38, grade = '1등급', submitted_at = NOW() - INTERVAL '1 day'
        WHERE id = english_sheet_id;
    END IF;
END $$;

-- Function to calculate answer sheet statistics
CREATE OR REPLACE FUNCTION get_answer_sheet_stats(sheet_id UUID)
RETURNS TABLE (
    total_answered INTEGER,
    mcq_answered INTEGER,
    text_answered INTEGER,
    completion_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_answered,
        COUNT(CASE WHEN question_type = 'mcq' AND mcq_option IS NOT NULL THEN 1 END)::INTEGER as mcq_answered,
        COUNT(CASE WHEN question_type = 'text' AND text_answer IS NOT NULL AND text_answer != '' THEN 1 END)::INTEGER as text_answered,
        ROUND((COUNT(*) * 100.0 / (SELECT total_questions FROM answer_sheets WHERE id = sheet_id)), 2) as completion_percentage
    FROM answer_sheet_responses 
    WHERE answer_sheet_id = sheet_id
    AND (
        (question_type = 'mcq' AND mcq_option IS NOT NULL) OR 
        (question_type = 'text' AND text_answer IS NOT NULL AND text_answer != '')
    );
END;
$$ LANGUAGE plpgsql;

-- Function to submit an answer sheet (change status and set submitted_at)
CREATE OR REPLACE FUNCTION submit_answer_sheet(sheet_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE answer_sheets 
    SET status = 'submitted', submitted_at = NOW()
    WHERE id = sheet_id AND status = 'draft';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to grade an answer sheet (for future auto-grading functionality)
CREATE OR REPLACE FUNCTION grade_answer_sheet(sheet_id UUID, correct_answers JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    response_record RECORD;
    correct_answer TEXT;
    total_score INTEGER := 0;
    max_score INTEGER;
BEGIN
    -- Get max possible score based on total questions
    SELECT total_questions INTO max_score FROM answer_sheets WHERE id = sheet_id;
    
    -- Grade each response
    FOR response_record IN 
        SELECT * FROM answer_sheet_responses WHERE answer_sheet_id = sheet_id
    LOOP
        correct_answer := correct_answers ->> response_record.question_number::TEXT;
        
        IF response_record.question_type = 'mcq' THEN
            IF response_record.mcq_option::TEXT = correct_answer THEN
                UPDATE answer_sheet_responses 
                SET is_correct = true, points_earned = 
                    CASE 
                        WHEN (SELECT subject FROM answer_sheets WHERE id = sheet_id) = 'mathematics' THEN 4.0
                        WHEN (SELECT subject FROM answer_sheets WHERE id = sheet_id) = 'english' THEN 2.0
                        ELSE 2.0
                    END
                WHERE id = response_record.id;
                
                total_score := total_score + 
                    CASE 
                        WHEN (SELECT subject FROM answer_sheets WHERE id = sheet_id) = 'mathematics' THEN 4
                        WHEN (SELECT subject FROM answer_sheets WHERE id = sheet_id) = 'english' THEN 2
                        ELSE 2
                    END;
            ELSE
                UPDATE answer_sheet_responses 
                SET is_correct = false, points_earned = 0
                WHERE id = response_record.id;
            END IF;
        END IF;
    END LOOP;
    
    -- Update answer sheet with final score and status
    UPDATE answer_sheets 
    SET score = total_score, status = 'graded'
    WHERE id = sheet_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create a view for answer sheet summary
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
    ROUND((COUNT(r.id) * 100.0 / a.total_questions), 2) as completion_percentage
FROM answer_sheets a
LEFT JOIN answer_sheet_responses r ON a.id = r.answer_sheet_id
WHERE (r.question_type = 'mcq' AND r.mcq_option IS NOT NULL) 
   OR (r.question_type = 'text' AND r.text_answer IS NOT NULL AND r.text_answer != '')
   OR r.id IS NULL
GROUP BY a.id, a.user_id, a.subject, a.sheet_name, a.test_type, a.total_questions, 
         a.mcq_questions, a.text_questions, a.status, a.score, a.grade, a.submitted_at, a.created_at;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON answer_sheets TO authenticated;
-- GRANT ALL ON answer_sheet_responses TO authenticated;
-- GRANT ALL ON answer_sheet_templates TO authenticated;
-- GRANT SELECT ON answer_sheet_summary TO authenticated;