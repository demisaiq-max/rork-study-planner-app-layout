import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';

export const deleteExam = protectedProcedure
  .input(z.object({
    id: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { error } = await ctx.supabase
      .from('exams')
      .delete()
      .eq('id', input.id)
      .eq('user_id', ctx.userId);

    if (error) {
      throw new Error(`Failed to delete exam: ${error.message}`);
    }

    return { success: true };
  });

export default deleteExam;