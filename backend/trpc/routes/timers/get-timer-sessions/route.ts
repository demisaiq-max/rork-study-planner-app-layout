import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';

export const getTimerSessionsProcedure = protectedProcedure
  .input(z.object({
    limit: z.number().optional().default(50),
    subject: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    completedOnly: z.boolean().optional().default(false),
  }))
  .query(async ({ input, ctx }) => {
    try {
      let query = ctx.supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', ctx.userId)
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

      if (input.completedOnly) {
        query = query.eq('is_completed', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching timer sessions:', error);
        throw new Error(`Failed to fetch timer sessions: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Error in getTimerSessions:', err);
      throw err;
    }
  });