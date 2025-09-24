import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';

export const deletePriorityTaskProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { error } = await ctx.supabase
      .from('priority_tasks')
      .delete()
      .eq('id', input.id)
      .eq('user_id', ctx.userId);

    if (error) {
      console.error('Error deleting priority task:', error);
      throw new Error(error.message || 'Failed to delete priority task');
    }

    return { success: true };
  });