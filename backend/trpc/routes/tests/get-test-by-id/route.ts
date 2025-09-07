import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const getTestById = publicProcedure
  .input(z.object({ 
    testId: z.string()
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
      .eq('id', input.testId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch test: ${error.message}`);
    }

    return data;
  });

export default getTestById;