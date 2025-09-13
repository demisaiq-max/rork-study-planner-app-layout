import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const updatePriorityTaskProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
    title: z.string().optional(),
    subject: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    orderIndex: z.number().optional(),
    completed: z.boolean().optional(),
  }))
  .mutation(async ({ input }) => {
    const { id, ...updates } = input;
    
    const { data, error } = await supabase
      .from('priority_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating priority task:', error);
      throw new Error('Failed to update priority task');
    }

    return data;
  });