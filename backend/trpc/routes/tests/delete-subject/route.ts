import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const deleteSubject = publicProcedure
  .input(z.object({ 
    id: z.string(),
    userId: z.string()
  }))
  .mutation(async ({ input }) => {
    // Check if there are any answer sheets using this subject
    const { data: answerSheets } = await supabase
      .from('answer_sheets')
      .select('id')
      .eq('user_id', input.userId)
      .eq('subject_id', input.id)
      .limit(1);

    if (answerSheets && answerSheets.length > 0) {
      throw new Error('Cannot delete subject with existing answer sheets');
    }

    // Check if there are any exams using this subject
    const { data: exams } = await supabase
      .from('exams')
      .select('id')
      .eq('user_id', input.userId)
      .eq('subject', input.id)
      .limit(1);

    if (exams && exams.length > 0) {
      throw new Error('Cannot delete subject with existing exams');
    }

    // Delete the subject
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', input.id)
      .eq('user_id', input.userId);

    if (error) {
      throw new Error(`Failed to delete subject: ${error.message}`);
    }
    
    return { success: true };
  });

export default deleteSubject;