import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const updateTimerSessionProcedure = publicProcedure
  .input(z.object({
    id: z.string(),
    endTime: z.string().optional(),
    isCompleted: z.boolean().optional(),
    isPaused: z.boolean().optional(),
    pauseDuration: z.number().optional(),
    notes: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const updateData: any = {};
      
      if (input.endTime !== undefined) updateData.end_time = input.endTime;
      if (input.isCompleted !== undefined) updateData.is_completed = input.isCompleted;
      if (input.isPaused !== undefined) updateData.is_paused = input.isPaused;
      if (input.pauseDuration !== undefined) updateData.pause_duration = input.pauseDuration;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const { data, error } = await supabase
        .from('timer_sessions')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating timer session:', error);
        throw new Error('Failed to update timer session');
      }

      return data;
    } catch (err) {
      console.error('Error in updateTimerSession:', err);
      throw err;
    }
  });