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
    questionConfig: z.string().optional(), // JSON string of question configuration
  }))
  .mutation(async ({ input }) => {
    console.log('Updating answer sheet:', input.sheetId);
    
    const updateData: any = {};
    
    if (input.sheetName !== undefined) updateData.sheet_name = input.sheetName;
    if (input.testType !== undefined) updateData.test_type = input.testType;
    if (input.totalQuestions !== undefined) updateData.total_questions = input.totalQuestions;
    if (input.mcqQuestions !== undefined) updateData.mcq_questions = input.mcqQuestions;
    if (input.textQuestions !== undefined) updateData.text_questions = input.textQuestions;
    
    // Update total questions if mcq or text questions are provided
    if (input.mcqQuestions !== undefined || input.textQuestions !== undefined) {
      const currentMcq = input.mcqQuestions !== undefined ? input.mcqQuestions : 0;
      const currentText = input.textQuestions !== undefined ? input.textQuestions : 0;
      
      // If only one is provided, we need to get the current value of the other
      if (input.mcqQuestions !== undefined && input.textQuestions === undefined) {
        // Get current text questions count
        const { data: currentSheet } = await supabase
          .from('answer_sheets')
          .select('text_questions')
          .eq('id', input.sheetId)
          .single();
        
        if (currentSheet) {
          updateData.total_questions = currentMcq + (currentSheet.text_questions || 0);
        }
      } else if (input.textQuestions !== undefined && input.mcqQuestions === undefined) {
        // Get current mcq questions count
        const { data: currentSheet } = await supabase
          .from('answer_sheets')
          .select('mcq_questions')
          .eq('id', input.sheetId)
          .single();
        
        if (currentSheet) {
          updateData.total_questions = (currentSheet.mcq_questions || 0) + currentText;
        }
      } else {
        // Both are provided
        updateData.total_questions = currentMcq + currentText;
      }
    }
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