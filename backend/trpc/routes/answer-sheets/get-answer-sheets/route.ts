import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const getAnswerSheetsProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    subject: z.enum(['korean', 'mathematics', 'english', 'others']).optional(),
    testType: z.enum(['practice', 'mock', 'midterm', 'final']).optional(),
    status: z.enum(['draft', 'submitted', 'graded']).optional(),
  }))
  .query(async ({ input }) => {
    console.log('Getting answer sheets for user:', input.userId);
    
    // Use the answer_sheets table directly instead of the view to ensure real-time data
    let query = supabase
      .from('answer_sheets')
      .select(`
        id,
        user_id,
        subject,
        subject_id,
        sheet_name,
        test_type,
        total_questions,
        mcq_questions,
        text_questions,
        status,
        score,
        grade,
        submitted_at,
        created_at
      `)
      .eq('user_id', input.userId)
      .order('created_at', { ascending: false });

    if (input.subject) {
      query = query.eq('subject', input.subject);
    }

    if (input.testType) {
      query = query.eq('test_type', input.testType);
    }

    if (input.status) {
      query = query.eq('status', input.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting answer sheets:', error);
      throw new Error(`Failed to get answer sheets: ${error.message}`);
    }

    console.log('Retrieved answer sheets:', data?.length || 0);
    return data || [];
  });

export default getAnswerSheetsProcedure;