import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const getLatestTestResults = publicProcedure
  .input(z.string().optional())
  .query(async ({ input }) => {
    try {
      const userId = input || 'default-user';
      
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error in getLatestTestResults:', error);
        // Return empty array instead of throwing to avoid JSON parse errors
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Group by subject and get the latest result for each
      const latestBySubject: Record<string, any> = {};
      
      data.forEach(result => {
        if (result.tests && result.tests.subject) {
          const subject = result.tests.subject;
          if (!latestBySubject[subject] || 
              new Date(result.created_at) > new Date(latestBySubject[subject].created_at)) {
            latestBySubject[subject] = result;
          }
        }
      });

      return Object.values(latestBySubject);
    } catch (err) {
      console.error('Error in getLatestTestResults:', err);
      // Always return valid JSON
      return [];
    }
  });

export default getLatestTestResults;
