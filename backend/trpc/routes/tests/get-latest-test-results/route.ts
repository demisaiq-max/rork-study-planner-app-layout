import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';

const getLatestTestResults = protectedProcedure
  .input(z.object({ userId: z.string().uuid().optional() }).optional())
  .query(async ({ ctx }) => {
    try {
      const { data, error } = await ctx.supabase
        .from('test_results')
        .select(`
          *,
          tests!inner (
            id,
            subject,
            test_name,
            test_type,
            test_date
          )
        `)
        .eq('user_id', ctx.userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error in getLatestTestResults:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      const latestByTestId: Record<string, any> = {};

      data.forEach((result: any) => {
        const testId = result?.tests?.id as string | undefined;
        if (!testId) return;
        const current = latestByTestId[testId];
        if (!current || new Date(result.created_at) > new Date(current.created_at)) {
          latestByTestId[testId] = result;
        }
      });

      const results = Object.values(latestByTestId).sort((a: any, b: any) => {
        const aDate = new Date(a?.tests?.test_date ?? a.created_at).getTime();
        const bDate = new Date(b?.tests?.test_date ?? b.created_at).getTime();
        if (bDate !== aDate) return bDate - aDate;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return results;
    } catch (err) {
      console.error('Error in getLatestTestResults:', err);
      return [];
    }
  });

export { getLatestTestResults };
export default getLatestTestResults;
