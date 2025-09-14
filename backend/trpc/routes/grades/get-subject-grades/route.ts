import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const getSubjectGrades = publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input }) => {
    const { data, error } = await supabase
      .from('subject_grades')
      .select('*')
      .eq('user_id', input.userId);

    if (error) {
      throw new Error(`Failed to fetch subject grades: ${error.message}`);
    }

    return data || [];
  });

export default getSubjectGrades;