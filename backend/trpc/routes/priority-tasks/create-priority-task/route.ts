import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';

export const createPriorityTaskProcedure = protectedProcedure
  .input(z.object({
    title: z.string(),
    subject: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    orderIndex: z.number(),
    completed: z.boolean().optional().default(false),
  }))
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from('priority_tasks')
      .insert({
        user_id: ctx.userId,
        title: input.title,
        subject: input.subject,
        priority: input.priority,
        order_index: input.orderIndex,
        completed: input.completed ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating priority task:', error);
      throw new Error(error.message || 'Failed to create priority task');
    }

    return data;
  });