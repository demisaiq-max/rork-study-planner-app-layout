import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const saveAnswerProcedure = publicProcedure
  .input(z.object({
    sheetId: z.string(),
    questionNumber: z.number().min(1),
    questionType: z.enum(['mcq', 'text']),
    mcqOption: z.number().min(1).max(5).optional(),
    textAnswer: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log('Saving answer for sheet:', input.sheetId, 'question:', input.questionNumber);
    
    // Validate input based on question type
    if (input.questionType === 'mcq' && !input.mcqOption) {
      throw new Error('MCQ option is required for MCQ questions');
    }
    if (input.questionType === 'text' && !input.textAnswer) {
      throw new Error('Text answer is required for text questions');
    }

    const responseData: any = {
      answer_sheet_id: input.sheetId,
      question_number: input.questionNumber,
      question_type: input.questionType,
    };

    if (input.questionType === 'mcq') {
      responseData.mcq_option = input.mcqOption;
      responseData.text_answer = null;
    } else {
      responseData.text_answer = input.textAnswer;
      responseData.mcq_option = null;
    }

    // Use upsert to handle both insert and update
    const { data, error } = await supabase
      .from('answer_sheet_responses')
      .upsert(responseData, {
        onConflict: 'answer_sheet_id,question_number'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving answer:', error);
      throw new Error(`Failed to save answer: ${error.message}`);
    }

    console.log('Answer saved successfully:', data);
    return data;
  });

export default saveAnswerProcedure;