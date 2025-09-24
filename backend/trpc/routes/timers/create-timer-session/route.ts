import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';
import { ensureUserExists } from '@/backend/lib/user-utils';

export const createTimerSessionProcedure = protectedProcedure
  .input(z.object({
    subject: z.string().optional(),
    duration: z.number(), // in seconds
    startTime: z.string(),
    notes: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      console.log('Creating timer session for user:', ctx.userId);
      
      // Ensure user exists in the database first
      await ensureUserExists(ctx.supabase, ctx.userId, ctx.user);
      
      const { data, error } = await ctx.supabase
        .from('timer_sessions')
        .insert({
          user_id: ctx.userId,
          subject: input.subject,
          duration: input.duration,
          start_time: input.startTime,
          notes: input.notes,
          is_completed: false,
          is_paused: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating timer session:', error);
        throw new Error(`Failed to create timer session: ${error.message}`);
      }

      console.log('Timer session created successfully:', data.id);
      return data;
    } catch (err) {
      console.error('Error in createTimerSession:', err);
      throw err;
    }
  });