import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';

export const updatePriorityTaskProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
    title: z.string().optional(),
    subject: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    orderIndex: z.number().optional(),
    completed: z.boolean().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input;
    
    const { data, error } = await ctx.supabase
      .from('priority_tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', ctx.userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating priority task:', error);
      throw new Error(error.message || 'Failed to update priority task');
    }

    return data;
  });