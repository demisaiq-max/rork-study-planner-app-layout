import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';

export const getPriorityTasksProcedure = publicProcedure
  .input(z.object({
    userId: z.string().optional(),
  }))
  .query(async ({ input }) => {
    // Use test user ID if not provided
    const userId = input.userId || '550e8400-e29b-41d4-a716-446655440000';
    
    const { data, error } = await supabase
      .from('priority_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching priority tasks:', error);
      throw new Error('Failed to fetch priority tasks');
    }

    return data || [];
  });