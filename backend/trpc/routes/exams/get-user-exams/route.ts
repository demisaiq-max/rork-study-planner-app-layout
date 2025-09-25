import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';

export const getUserExams = protectedProcedure
  .input(z.object({ userId: z.string().uuid().optional() }).optional())
  .query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('exams')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch exams: ${error.message}`);
    }

    return data || [];
  });