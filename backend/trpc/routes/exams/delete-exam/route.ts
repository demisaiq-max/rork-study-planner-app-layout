import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const deleteExam = publicProcedure
  .input(z.object({
    id: z.string(),
    userId: z.string(),
  }))
  .mutation(async ({ input }) => {
    // Use the test user UUID from the database if 'test-user' is passed
    const userId = input.userId === 'test-user' 
      ? '550e8400-e29b-41d4-a716-446655440000' 
      : input.userId;
    
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', input.id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete exam: ${error.message}`);
    }

    return { success: true };
  });

export default deleteExam;