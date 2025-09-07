import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const createTest = publicProcedure
  .input(z.object({
    userId: z.string(),
    subject: z.string(),
    testType: z.enum(['mock', 'midterm', 'final']),
    testName: z.string(),
    testDate: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    const { data, error } = await supabase
      .from('tests')
      .insert({
        user_id: input.userId,
        subject: input.subject,
        test_type: input.testType,
        test_name: input.testName,
        test_date: input.testDate || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test: ${error.message}`);
    }

    return data;
  });

export default createTest;