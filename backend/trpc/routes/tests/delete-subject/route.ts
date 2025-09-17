import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const deleteSubject = publicProcedure
  .input(z.object({ 
    userId: z.string(),
    subject: z.string()
  }))
  .mutation(async ({ input }) => {
    // First, get test IDs for this subject
    const { data: testIds } = await supabase
      .from('tests')
      .select('id')
      .eq('user_id', input.userId)
      .eq('subject', input.subject);

    // Delete test results if there are any tests
    if (testIds && testIds.length > 0) {
      const testIdArray = testIds.map(test => test.id);
      await supabase
        .from('test_results')
        .delete()
        .in('test_id', testIdArray);
    }

    // Then delete all tests for this subject
    const { error: testsError } = await supabase
      .from('tests')
      .delete()
      .eq('user_id', input.userId)
      .eq('subject', input.subject);

    if (testsError) {
      throw new Error(`Failed to delete tests: ${testsError.message}`);
    }
    
    return { success: true };
  });

export default deleteSubject;