import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const deletePriorityTaskProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { error } = await supabase
      .from('priority_tasks')
      .delete()
      .eq('id', input.id);

    if (error) {
      console.error('Error deleting priority task:', error);
      throw new Error('Failed to delete priority task');
    }

    return { success: true };
  });