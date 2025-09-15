import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';

export const createPauseLogProcedure = protectedProcedure
  .input(z.object({
    sessionId: z.string(),
    pauseTime: z.string(),
    resumeTime: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // First verify that the session belongs to the authenticated user
      const { data: session, error: sessionError } = await ctx.supabase
        .from('timer_sessions')
        .select('user_id')
        .eq('id', input.sessionId)
        .single();

      if (sessionError || !session || session.user_id !== ctx.userId) {
        throw new Error('Session not found or unauthorized');
      }

      const { data, error } = await ctx.supabase
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
        throw new Error(`Failed to create pause log: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Error in createPauseLog:', err);
      throw err;
    }
  });