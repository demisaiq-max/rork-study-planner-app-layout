import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const updateAnswerSheetProcedure = publicProcedure
  .input(z.object({
    sheetId: z.string(),
    sheetName: z.string().optional(),
    testType: z.enum(['practice', 'mock', 'midterm', 'final']).optional(),
    totalQuestions: z.number().min(1).max(200).optional(),
    mcqQuestions: z.number().min(0).optional(),
    textQuestions: z.number().min(0).optional(),
    status: z.enum(['draft', 'submitted', 'graded']).optional(),
    score: z.number().optional(),
    grade: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log('Updating answer sheet:', input.sheetId);
    
    const updateData: any = {};
    
    if (input.sheetName !== undefined) updateData.sheet_name = input.sheetName;
    if (input.testType !== undefined) updateData.test_type = input.testType;
    if (input.totalQuestions !== undefined) updateData.total_questions = input.totalQuestions;
    if (input.mcqQuestions !== undefined) updateData.mcq_questions = input.mcqQuestions;
    if (input.textQuestions !== undefined) updateData.text_questions = input.textQuestions;
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === 'submitted') {
        updateData.submitted_at = new Date().toISOString();
      }
    }
    if (input.score !== undefined) updateData.score = input.score;
    if (input.grade !== undefined) updateData.grade = input.grade;

    const { data, error } = await supabase
      .from('answer_sheets')
      .update(updateData)
      .eq('id', input.sheetId)
      .select()
      .single();

    if (error) {
      console.error('Error updating answer sheet:', error);
      throw new Error(`Failed to update answer sheet: ${error.message}`);
    }

    console.log('Answer sheet updated successfully:', data);
    return data;
  });

export default updateAnswerSheetProcedure;