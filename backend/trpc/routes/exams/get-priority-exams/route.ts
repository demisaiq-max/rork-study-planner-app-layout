import { protectedProcedure } from '@/backend/trpc/create-context';

export const getPriorityExams = protectedProcedure
  .query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('exams')
      .select('*')
      .eq('user_id', ctx.userId)
      .eq('priority', true)
      .order('date', { ascending: true })
      .limit(3);

    if (error) {
      throw new Error(`Failed to fetch priority exams: ${error.message}`);
    }

    return data || [];
  });

export default getPriorityExams;