import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const createPauseLogProcedure = publicProcedure
  .input(z.object({
    sessionId: z.string(),
    pauseTime: z.string(),
    resumeTime: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const { data, error } = await supabase
        .from('timer_pause_logs')
        .insert({
          session_id: input.sessionId,
          pause_time: input.pauseTime,
          resume_time: input.resumeTime,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating pause log:', error);
        throw new Error('Failed to create pause log');
      }

      return data;
    } catch (err) {
      console.error('Error in createPauseLog:', err);
      throw err;
    }
  });