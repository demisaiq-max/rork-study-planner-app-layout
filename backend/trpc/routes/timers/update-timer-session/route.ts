import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';

export const updateTimerSessionProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
    endTime: z.string().optional(),
    isCompleted: z.boolean().optional(),
    isPaused: z.boolean().optional(),
    pauseDuration: z.number().optional(),
    notes: z.string().optional(),
    duration: z.number().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      const updateData: any = {};
      
      if (input.endTime !== undefined) updateData.end_time = input.endTime;
      if (input.isCompleted !== undefined) updateData.is_completed = input.isCompleted;
      if (input.isPaused !== undefined) updateData.is_paused = input.isPaused;
      if (input.pauseDuration !== undefined) updateData.pause_duration = input.pauseDuration;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.duration !== undefined) updateData.duration = input.duration;

      const { data, error } = await ctx.supabase
        .from('timer_sessions')
        .update(updateData)
        .eq('id', input.id)
        .eq('user_id', ctx.userId) // Ensure user can only update their own sessions
        .select()
        .single();

      if (error) {
        console.error('Error updating timer session:', error);
        throw new Error(`Failed to update timer session: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Error in updateTimerSession:', err);
      throw err;
    }
  });