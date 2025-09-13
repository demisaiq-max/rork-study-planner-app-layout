import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const getPriorityExams = publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input }) => {
    // Use the test user UUID from the database if 'test-user' is passed
    const userId = input.userId === 'test-user' 
      ? '550e8400-e29b-41d4-a716-446655440000' 
      : input.userId;
    
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', userId)
      .eq('priority', true)
      .order('date', { ascending: true })
      .limit(3);

    if (error) {
      throw new Error(`Failed to fetch priority exams: ${error.message}`);
    }

    return data || [];
  });

export default getPriorityExams;