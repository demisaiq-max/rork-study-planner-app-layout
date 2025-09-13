import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const createStudySession = publicProcedure
  .input(z.object({
    userId: z.string(),
    subject: z.string(),
    duration: z.number(),
    date: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id: input.userId,
        subject: input.subject,
        duration: input.duration,
        date: input.date,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create study session: ${error.message}`);
    }

    return data;
  });

export default createStudySession;