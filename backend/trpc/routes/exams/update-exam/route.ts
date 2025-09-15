import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';

export const updateExam = protectedProcedure
  .input(z.object({
    id: z.string(),
    title: z.string().optional(),
    date: z.string().optional(),
    subject: z.string().optional(),
    priority: z.boolean().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;
    
    const { data, error } = await ctx.supabase
      .from('exams')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', ctx.userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update exam: ${error.message}`);
    }

    return data;
  });

export default updateExam;