import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const createTimerSessionProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    subject: z.string().optional(),
    duration: z.number(), // in seconds
    startTime: z.string(),
    notes: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const { data, error } = await supabase
        .from('timer_sessions')
        .insert({
          user_id: input.userId,
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
        throw new Error('Failed to create timer session');
      }

      return data;
    } catch (err) {
      console.error('Error in createTimerSession:', err);
      throw err;
    }
  });