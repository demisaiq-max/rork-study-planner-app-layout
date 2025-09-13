import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const getActiveTimerProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      // Get the most recent timer session that is not completed
      const { data, error } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', input.userId)
        .eq('is_completed', false)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching active timer:', error);
        throw new Error('Failed to fetch active timer');
      }

      return data;
    } catch (err) {
      console.error('Error in getActiveTimer:', err);
      return null; // Return null if no active timer found
    }
  });