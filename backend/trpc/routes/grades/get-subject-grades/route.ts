import { protectedProcedure } from '@/backend/trpc/create-context';

export const getSubjectGrades = protectedProcedure
  .query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('subject_grades')
      .select('*')
      .eq('user_id', ctx.userId);

    if (error) {
      throw new Error(`Failed to fetch subject grades: ${error.message}`);
    }

    return data || [];
  });

export default getSubjectGrades;