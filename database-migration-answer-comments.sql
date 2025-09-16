-- Migration to add answer comments functionality
-- Run this SQL in your Supabase SQL Editor

-- Answer comments table for replies to answers
CREATE TABLE IF NOT EXISTS answer_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_urls TEXT[],
    likes_count INTEGER DEFAULT 0,
    parent_comment_id UUID REFERENCES answer_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answer comment likes table
CREATE TABLE IF NOT EXISTS answer_comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES answer_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Create indexes for answer comments
CREATE INDEX IF NOT EXISTS idx_answer_comments_answer_id ON answer_comments(answer_id);
CREATE INDEX IF NOT EXISTS idx_answer_comments_user_id ON answer_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_comments_created_at ON answer_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answer_comment_likes_comment_id ON answer_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_answer_comment_likes_user_id ON answer_comment_likes(user_id);

-- Create trigger for answer comments updated_at
DROP TRIGGER IF EXISTS update_answer_comments_updated_at ON answer_comments;
CREATE TRIGGER update_answer_comments_updated_at BEFORE UPDATE ON answer_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update likes count in answer comments
CREATE OR REPLACE FUNCTION update_answer_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE answer_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE answer_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_answer_comment_likes_count_trigger ON answer_comment_likes;
CREATE TRIGGER update_answer_comment_likes_count_trigger
AFTER INSERT OR DELETE ON answer_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_answer_comment_likes_count();

-- Enable Row Level Security for answer comment tables
ALTER TABLE answer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for answer comments
DROP POLICY IF EXISTS "Public read access" ON answer_comments;
DROP POLICY IF EXISTS "Public write access" ON answer_comments;
DROP POLICY IF EXISTS "Public update access" ON answer_comments;
DROP POLICY IF EXISTS "Public delete access" ON answer_comments;
CREATE POLICY "Public read access" ON answer_comments FOR SELECT USING (true);
CREATE POLICY "Public write access" ON answer_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON answer_comments FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON answer_comments FOR DELETE USING (true);

-- Create RLS policies for answer comment likes
DROP POLICY IF EXISTS "Public read access" ON answer_comment_likes;
DROP POLICY IF EXISTS "Public write access" ON answer_comment_likes;
DROP POLICY IF EXISTS "Public update access" ON answer_comment_likes;
DROP POLICY IF EXISTS "Public delete access" ON answer_comment_likes;
CREATE POLICY "Public read access" ON answer_comment_likes FOR SELECT USING (true);
CREATE POLICY "Public write access" ON answer_comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON answer_comment_likes FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON answer_comment_likes FOR DELETE USING (true);

-- Add comments_count column to answers table if it doesn't exist
ALTER TABLE answers ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Function to update comments count in answers
CREATE OR REPLACE FUNCTION update_answer_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE answers SET comments_count = comments_count + 1 WHERE id = NEW.answer_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE answers SET comments_count = comments_count - 1 WHERE id = OLD.answer_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_answer_comments_count_trigger ON answer_comments;
CREATE TRIGGER update_answer_comments_count_trigger
AFTER INSERT OR DELETE ON answer_comments
FOR EACH ROW EXECUTE FUNCTION update_answer_comments_count();