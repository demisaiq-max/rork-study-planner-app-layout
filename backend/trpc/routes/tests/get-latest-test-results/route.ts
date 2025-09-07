import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const getLatestTestResults = publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input }) => {
    // Get the latest test result for each subject
    const { data, error } = await supabase
      .from('test_results')
      .select(`
        *,
        tests!inner (
          subject,
          test_name,
          test_type,
          test_date
        )
      `)
      .eq('user_id', input.userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch latest test results: ${error.message}`);
    }

    // Group by subject and get the latest result for each
    const latestBySubject: Record<string, any> = {};
    
    data?.forEach(result => {
      const subject = result.tests.subject;
      if (!latestBySubject[subject] || 
          new Date(result.created_at) > new Date(latestBySubject[subject].created_at)) {
        latestBySubject[subject] = result;
      }
    });

    return Object.values(latestBySubject);
  });

export default getLatestTestResults;