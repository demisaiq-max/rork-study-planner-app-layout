import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const getPriorityTasksProcedure = protectedProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    const { data, error } = await supabase
      .from('priority_tasks')
      .select('*')
      .eq('user_id', input.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching priority tasks:', error);
      throw new Error('Failed to fetch priority tasks');
    }

    return data || [];
  });