import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const deleteExam = publicProcedure
  .input(z.object({
    id: z.string(),
    userId: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', input.id)
      .eq('user_id', input.userId);

    if (error) {
      throw new Error(`Failed to delete exam: ${error.message}`);
    }

    return { success: true };
  });

export default deleteExam;