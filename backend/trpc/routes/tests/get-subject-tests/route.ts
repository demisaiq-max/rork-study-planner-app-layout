import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const getSubjectTests = publicProcedure
  .input(z.object({ 
    userId: z.string(),
    subject: z.string()
  }))
  .query(async ({ input }) => {
    const { data, error } = await supabase
      .from('tests')
      .select(`
        *,
        test_results (
          id,
          raw_score,
          standard_score,
          percentile,
          grade,
          answer_sheet_image_url,
          analysis_data
        )
      `)
      .eq('user_id', input.userId)
      .eq('subject', input.subject)
      .order('test_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tests: ${error.message}`);
    }

    return data || [];
  });

export default getSubjectTests;