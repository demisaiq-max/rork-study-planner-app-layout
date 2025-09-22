import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const deleteAnswerSheetProcedure = publicProcedure
  .input(z.object({
    sheetId: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('Deleting answer sheet:', input.sheetId);
    
    // Delete the answer sheet (responses will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('answer_sheets')
      .delete()
      .eq('id', input.sheetId);

    if (error) {
      console.error('Error deleting answer sheet:', error);
      throw new Error(`Failed to delete answer sheet: ${error.message}`);
    }

    console.log('Answer sheet deleted successfully');
    return { success: true };
  });

export default deleteAnswerSheetProcedure;