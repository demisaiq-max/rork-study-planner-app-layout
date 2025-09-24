import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';
import { ensureUserExists } from '@/backend/lib/user-utils';

export const createStudySession = protectedProcedure
  .input(z.object({
    subject: z.string(),
    duration: z.number(),
    date: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    // Ensure user exists in the database first
    await ensureUserExists(ctx.supabase, ctx.userId, ctx.user);
    
    const { data, error } = await ctx.supabase
      .from('study_sessions')
      .insert({
        user_id: ctx.userId,
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