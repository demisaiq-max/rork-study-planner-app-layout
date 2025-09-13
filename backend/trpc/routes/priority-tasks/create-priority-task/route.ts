import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const createPriorityTaskProcedure = protectedProcedure
  .input(z.object({
    userId: z.string(),
    title: z.string(),
    subject: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    orderIndex: z.number(),
    completed: z.boolean().optional().default(false),
  }))
  .mutation(async ({ input }) => {
    const { data, error } = await supabase
      .from('priority_tasks')
      .insert({
        user_id: input.userId,
        title: input.title,
        subject: input.subject,
        priority: input.priority,
        order_index: input.orderIndex,
        completed: input.completed,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating priority task:', error);
      throw new Error('Failed to create priority task');
    }

    return data;
  });