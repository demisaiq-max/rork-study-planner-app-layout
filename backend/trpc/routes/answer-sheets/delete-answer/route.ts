import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const deleteAnswerProcedure = publicProcedure
  .input(z.object({
    sheetId: z.string(),
    questionNumber: z.number().min(1),
  }))
  .mutation(async ({ input }) => {
    console.log('Deleting answer for sheet:', input.sheetId, 'question:', input.questionNumber);
    
    // Delete the specific answer
    const { error } = await supabase
      .from('answer_sheet_responses')
      .delete()
      .eq('answer_sheet_id', input.sheetId)
      .eq('question_number', input.questionNumber);

    if (error) {
      console.error('Error deleting answer:', error);
      throw new Error(`Failed to delete answer: ${error.message}`);
    }

    // Update answer sheet statistics after deleting answer
    const { data: statsData, error: statsError } = await supabase
      .rpc('update_answer_sheet_stats', { sheet_id: input.sheetId });

    if (statsError) {
      console.error('Error updating answer sheet stats:', statsError);
      // Don't throw error here as the answer was deleted successfully
    }

    console.log('Answer deleted successfully');
    return { success: true };
  });

export default deleteAnswerProcedure;