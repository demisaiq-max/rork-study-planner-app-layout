-- ============================================
-- SUPABASE AUTH INTEGRATION FIX (Supabase-only)
-- ============================================
-- Purpose: Keep ALL user IDs as UUID and ensure every user_id FK
-- points to the local users table (UUID) which mirrors auth.users.
-- Run this in Supabase SQL editor.

-- 1) Safely drop dependent view first
DROP VIEW IF EXISTS answer_sheet_summary;

-- 2) Ensure our users table keeps UUID ids and is synced from auth.users
--    Create/replace the sync trigger that copies rows from auth.users
--    into public.users with the SAME UUID id.
CREATE OR REPLACE FUNCTION sync_auth_user_to_users_table()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  BEGIN
    INSERT INTO public.users (id, email, name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name',
               NEW.raw_user_meta_data->>'full_name',
               split_part(NEW.email, '@', 1)),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.users.name),
      updated_at = NOW();
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'sync_auth_user_to_users_table: swallowed error %', SQLERRM;
  END;

  RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS sync_auth_user_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_users_table();

-- Backfill existing auth users into users (UUID ids preserved)
INSERT INTO users (id, email, name, created_at, updated_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.created_at,
  COALESCE(u.updated_at, u.created_at)
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = COALESCE(EXCLUDED.name, users.name),
  updated_at = NOW();

-- 3) Ensure ALL user_id columns are UUID and FKs point to users(id)
-- Helper DO block for each table: if column exists and is NOT uuid, convert to uuid.

-- answer_sheets
ALTER TABLE answer_sheets DROP CONSTRAINT IF EXISTS answer_sheets_user_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'answer_sheets' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE answer_sheets ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;
ALTER TABLE answer_sheets
  ADD CONSTRAINT answer_sheets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- answer_key_templates.created_by
ALTER TABLE IF EXISTS answer_key_templates DROP CONSTRAINT IF EXISTS answer_key_templates_created_by_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'answer_key_templates' AND column_name = 'created_by' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE answer_key_templates ALTER COLUMN created_by TYPE uuid USING created_by::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS answer_key_templates
  ADD CONSTRAINT answer_key_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- answer_key_usage_logs.graded_by
ALTER TABLE IF EXISTS answer_key_usage_logs DROP CONSTRAINT IF EXISTS answer_key_usage_logs_graded_by_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'answer_key_usage_logs' AND column_name = 'graded_by' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE answer_key_usage_logs ALTER COLUMN graded_by TYPE uuid USING graded_by::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS answer_key_usage_logs
  ADD CONSTRAINT answer_key_usage_logs_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE CASCADE;

-- subjects.user_id
ALTER TABLE IF EXISTS subjects DROP CONSTRAINT IF EXISTS subjects_user_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subjects' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE subjects ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS subjects
  ADD CONSTRAINT subjects_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- exams.user_id
ALTER TABLE IF EXISTS exams DROP CONSTRAINT IF EXISTS exams_user_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE exams ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS exams
  ADD CONSTRAINT exams_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- brain_dumps.user_id
ALTER TABLE IF EXISTS brain_dumps DROP CONSTRAINT IF EXISTS brain_dumps_user_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brain_dumps' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE brain_dumps ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS brain_dumps
  ADD CONSTRAINT brain_dumps_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- priority_tasks.user_id
ALTER TABLE IF EXISTS priority_tasks DROP CONSTRAINT IF EXISTS priority_tasks_user_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'priority_tasks' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE priority_tasks ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS priority_tasks
  ADD CONSTRAINT priority_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- study_sessions.user_id
ALTER TABLE IF EXISTS study_sessions DROP CONSTRAINT IF EXISTS study_sessions_user_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_sessions' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE study_sessions ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS study_sessions
  ADD CONSTRAINT study_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- subject_grades.user_id
ALTER TABLE IF EXISTS subject_grades DROP CONSTRAINT IF EXISTS subject_grades_user_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subject_grades' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE subject_grades ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS subject_grades
  ADD CONSTRAINT subject_grades_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- user_settings.user_id
ALTER TABLE IF EXISTS user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE user_settings ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS user_settings
  ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- timer_sessions.user_id
ALTER TABLE IF EXISTS timer_sessions DROP CONSTRAINT IF EXISTS timer_sessions_user_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timer_sessions' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE timer_sessions ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS timer_sessions
  ADD CONSTRAINT timer_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- study_notes.user_id
ALTER TABLE IF EXISTS study_notes DROP CONSTRAINT IF EXISTS study_notes_user_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_notes' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE study_notes ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS study_notes
  ADD CONSTRAINT study_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- calendar_events.user_id
ALTER TABLE IF EXISTS calendar_events DROP CONSTRAINT IF EXISTS calendar_events_user_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE calendar_events ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;
ALTER TABLE IF EXISTS calendar_events
  ADD CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- answer_comments.user_id (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'answer_comments') THEN
    ALTER TABLE answer_comments DROP CONSTRAINT IF EXISTS answer_comments_user_id_fkey;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'answer_comments' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      ALTER TABLE answer_comments ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    END IF;
    ALTER TABLE answer_comments
      ADD CONSTRAINT answer_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- answer_comment_likes.user_id (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'answer_comment_likes') THEN
    ALTER TABLE answer_comment_likes DROP CONSTRAINT IF EXISTS answer_comment_likes_user_id_fkey;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'answer_comment_likes' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      ALTER TABLE answer_comment_likes ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    END IF;
    ALTER TABLE answer_comment_likes
      ADD CONSTRAINT answer_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4) Recreate dependent view
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
  COUNT(r.id) AS answered_questions,
  COUNT(CASE WHEN r.question_type = 'mcq' AND r.mcq_option IS NOT NULL THEN 1 END) AS mcq_answered,
  COUNT(CASE WHEN r.question_type = 'text' AND r.text_answer IS NOT NULL AND r.text_answer <> '' THEN 1 END) AS text_answered,
  ROUND((COUNT(r.id) * 100.0 / NULLIF(a.total_questions, 0)), 2) AS completion_percentage
FROM answer_sheets a
LEFT JOIN answer_sheet_responses r ON a.id = r.answer_sheet_id
  AND ((r.question_type = 'mcq' AND r.mcq_option IS NOT NULL) OR (r.question_type = 'text' AND r.text_answer IS NOT NULL AND r.text_answer <> ''))
GROUP BY a.id, a.user_id, a.subject, a.sheet_name, a.test_type, a.total_questions,
         a.mcq_questions, a.text_questions, a.status, a.score, a.grade, a.submitted_at, a.created_at;

-- 5) Optional: seed unified subjects for all users (UUID)
CREATE OR REPLACE FUNCTION create_unified_subjects_for_user(p_user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO subjects (user_id, name)
  VALUES
    (p_user_id, '국어'),
    (p_user_id, '영어'),
    (p_user_id, '수학'),
    (p_user_id, '탐구')
  ON CONFLICT (user_id, name) DO NOTHING;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_subjects_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_unified_subjects_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_subjects_on_user_insert ON users;
CREATE TRIGGER create_subjects_on_user_insert
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_subjects_for_new_user();

-- 6) Backfill unified subjects for existing users
DO $$
DECLARE u RECORD;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    PERFORM create_unified_subjects_for_user(u.id);
  END LOOP;
END $$;