import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const getUserSubjects = publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input }) => {
    // Get distinct subjects from tests table
    const { data, error } = await supabase
      .from('tests')
      .select('subject')
      .eq('user_id', input.userId)
      .order('subject');

    if (error) {
      throw new Error(`Failed to fetch subjects: ${error.message}`);
    }

    // Extract unique subjects
    const subjects = [...new Set(data?.map(item => item.subject) || [])];
    
    // If no subjects found, return default subjects
    if (subjects.length === 0) {
      return ['국어', '영어', '수학', '탐구'];
    }

    return subjects;
  });

export default getUserSubjects;