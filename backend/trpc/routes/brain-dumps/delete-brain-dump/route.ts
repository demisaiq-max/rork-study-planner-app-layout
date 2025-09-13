import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const deleteBrainDumpProcedure = protectedProcedure
  .input(z.object({
    id: z.string().uuid(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { error } = await supabase
      .from('brain_dumps')
      .delete()
      .eq('id', input.id)
      .eq('user_id', ctx.userId);

    if (error) {
      console.error('Error deleting brain dump:', error);
      throw new Error('Failed to delete brain dump');
    }

    return { success: true };
  });