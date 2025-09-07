import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const deleteSubjectGrade = publicProcedure
  .input(z.object({
    userId: z.string(),
    subject: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { error } = await supabase
      .from('subject_grades')
      .delete()
      .eq('user_id', input.userId)
      .eq('subject', input.subject);

    if (error) {
      throw new Error(`Failed to delete subject grade: ${error.message}`);
    }

    return { success: true };
  });

export default deleteSubjectGrade;