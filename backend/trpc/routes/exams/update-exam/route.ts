import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const updateExam = publicProcedure
  .input(z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string().optional(),
    date: z.string().optional(),
    subject: z.string().optional(),
    priority: z.boolean().optional(),
  }))
  .mutation(async ({ input }) => {
    const { id, userId, ...updateData } = input;
    
    const { data, error } = await supabase
      .from('exams')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update exam: ${error.message}`);
    }

    return data;
  });

export default updateExam;