import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const submitAnswerSheetProcedure = publicProcedure
  .input(z.object({
    sheetId: z.string(),
    answers: z.array(z.object({
      questionNumber: z.number(),
      questionType: z.enum(['mcq', 'text']),
      mcqOption: z.number().min(1).max(5).optional(),
      textAnswer: z.string().optional(),
    })),
  }))
  .mutation(async ({ input }) => {
    console.log('Submitting answer sheet:', input.sheetId, 'with', input.answers.length, 'answers');
    
    // Start a transaction to save all answers and update sheet status
    const { data: sheet, error: sheetError } = await supabase
      .from('answer_sheets')
      .select('*')
      .eq('id', input.sheetId)
      .single();

    if (sheetError) {
      console.error('Error getting answer sheet:', sheetError);
      throw new Error(`Failed to get answer sheet: ${sheetError.message}`);
    }

    if (sheet.status !== 'draft') {
      throw new Error('Answer sheet has already been submitted');
    }

    // Save all answers
    const responsePromises = input.answers.map(async (answer) => {
      const responseData: any = {
        answer_sheet_id: input.sheetId,
        question_number: answer.questionNumber,
        question_type: answer.questionType,
      };

      if (answer.questionType === 'mcq') {
        responseData.mcq_option = answer.mcqOption;
        responseData.text_answer = null;
      } else {
        responseData.text_answer = answer.textAnswer;
        responseData.mcq_option = null;
      }

      return supabase
        .from('answer_sheet_responses')
        .upsert(responseData, {
          onConflict: 'answer_sheet_id,question_number'
        });
    });

    const responses = await Promise.all(responsePromises);
    
    // Check for any errors in saving responses
    const responseErrors = responses.filter(r => r.error);
    if (responseErrors.length > 0) {
      console.error('Error saving responses:', responseErrors);
      throw new Error('Failed to save some answers');
    }

    // Update sheet status to submitted
    const { data: updatedSheet, error: updateError } = await supabase
      .from('answer_sheets')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', input.sheetId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating answer sheet status:', updateError);
      throw new Error(`Failed to submit answer sheet: ${updateError.message}`);
    }

    console.log('Answer sheet submitted successfully:', updatedSheet);
    return updatedSheet;
  });

export default submitAnswerSheetProcedure;