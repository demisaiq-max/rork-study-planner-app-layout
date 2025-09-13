import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const getTimerSessionsProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    limit: z.number().optional().default(50),
    subject: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }))
  .query(async ({ input }) => {
    try {
      let query = supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', input.userId)
        .order('start_time', { ascending: false })
        .limit(input.limit);

      if (input.subject) {
        query = query.eq('subject', input.subject);
      }

      if (input.startDate) {
        query = query.gte('start_time', input.startDate);
      }

      if (input.endDate) {
        query = query.lte('start_time', input.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching timer sessions:', error);
        throw new Error('Failed to fetch timer sessions');
      }

      return data || [];
    } catch (err) {
      console.error('Error in getTimerSessions:', err);
      throw err;
    }
  });