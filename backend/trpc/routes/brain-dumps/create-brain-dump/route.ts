import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const createBrainDumpProcedure = protectedProcedure
  .input(z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    category: z.string().optional(),
    is_pinned: z.boolean().optional().default(false),
    is_completed: z.boolean().optional().default(false),
  }))
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await supabase
      .from('brain_dumps')
      .insert({
        user_id: ctx.userId,
        title: input.title,
        content: input.content,
        category: input.category,
        is_pinned: input.is_pinned,
        is_completed: input.is_completed,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating brain dump:', error);
      throw new Error('Failed to create brain dump');
    }

    return data;
  });