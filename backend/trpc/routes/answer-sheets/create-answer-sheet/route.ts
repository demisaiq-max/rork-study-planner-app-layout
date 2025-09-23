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
    console.log('Creating answer sheet with real-time database support:', input);
    
    // Ensure MCQ + Text = Total for data consistency
    const finalMcqQuestions = input.mcqQuestions || 0;
    const finalTextQuestions = input.textQuestions || 0;
    const calculatedTotal = finalMcqQuestions + finalTextQuestions;
    
    // Use the calculated total if it matches, otherwise use the provided total and adjust MCQ
    let finalTotalQuestions = input.totalQuestions;
    let adjustedMcqQuestions = finalMcqQuestions;
    let adjustedTextQuestions = finalTextQuestions;
    
    if (calculatedTotal !== input.totalQuestions) {
      console.log(`Adjusting question counts: MCQ(${finalMcqQuestions}) + Text(${finalTextQuestions}) = ${calculatedTotal} != Total(${input.totalQuestions})`);
      // If total doesn't match, prioritize the total and adjust MCQ questions
      adjustedMcqQuestions = Math.max(0, input.totalQuestions - finalTextQuestions);
      adjustedTextQuestions = finalTextQuestions;
      finalTotalQuestions = adjustedMcqQuestions + adjustedTextQuestions;
    }
    
    console.log('Final question distribution:', {
      total: finalTotalQuestions,
      mcq: adjustedMcqQuestions,
      text: adjustedTextQuestions,
      subject: input.subject
    });
    
    const { data, error } = await supabase
      .from('answer_sheets')
      .insert({
        user_id: input.userId,
        subject: input.subject,
        sheet_name: input.sheetName,
        test_type: input.testType,
        total_questions: finalTotalQuestions,
        mcq_questions: adjustedMcqQuestions,
        text_questions: adjustedTextQuestions,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating answer sheet:', error);
      throw new Error(`Failed to create answer sheet: ${error.message}`);
    }

    console.log('✅ Answer sheet created successfully with real-time database support:', {
      id: data.id,
      total_questions: data.total_questions,
      mcq_questions: data.mcq_questions,
      text_questions: data.text_questions,
      subject: data.subject
    });
    return data;
  });

export default createAnswerSheetProcedure;