import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const createAnswerSheetProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    subject: z.enum(['korean', 'mathematics', 'english', 'others']),
    sheetName: z.string(),
    testType: z.enum(['practice', 'mock', 'midterm', 'final']).default('practice'),
    totalQuestions: z.number().min(1).max(200),
    mcqQuestions: z.number().min(0).default(0),
    textQuestions: z.number().min(0).default(0),
  }))
  .mutation(async ({ input }) => {
    console.log('Creating answer sheet:', input);
    
    const { data, error } = await supabase
      .from('answer_sheets')
      .insert({
        user_id: input.userId,
        subject: input.subject,
        sheet_name: input.sheetName,
        test_type: input.testType,
        total_questions: input.totalQuestions,
        mcq_questions: input.mcqQuestions,
        text_questions: input.textQuestions,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating answer sheet:', error);
      throw new Error(`Failed to create answer sheet: ${error.message}`);
    }

    console.log('Answer sheet created successfully:', data);
    return data;
  });

export default createAnswerSheetProcedure;