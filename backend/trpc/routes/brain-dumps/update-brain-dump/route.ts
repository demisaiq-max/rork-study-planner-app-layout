import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const updateBrainDumpProcedure = protectedProcedure
  .input(z.object({
    id: z.string().uuid(),
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    category: z.string().optional(),
    is_pinned: z.boolean().optional(),
    is_completed: z.boolean().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { id, ...updateData } = input;
    
    const { data, error } = await supabase
      .from('brain_dumps')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', ctx.userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating brain dump:', error);
      throw new Error('Failed to update brain dump');
    }

    return data;
  });