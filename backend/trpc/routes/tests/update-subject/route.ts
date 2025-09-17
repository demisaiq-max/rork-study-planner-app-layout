import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const updateSubject = publicProcedure
  .input(z.object({ 
    userId: z.string(),
    oldSubject: z.string(),
    newSubject: z.string()
  }))
  .mutation(async ({ input }) => {
    // Check if new subject name already exists
    const { data: existingTests } = await supabase
      .from('tests')
      .select('id')
      .eq('user_id', input.userId)
      .eq('subject', input.newSubject)
      .limit(1);

    if (existingTests && existingTests.length > 0) {
      throw new Error('Subject already exists');
    }

    // Update all tests with the old subject name to the new subject name
    const { error } = await supabase
      .from('tests')
      .update({ subject: input.newSubject })
      .eq('user_id', input.userId)
      .eq('subject', input.oldSubject);

    if (error) {
      throw new Error(`Failed to update subject: ${error.message}`);
    }

    return { success: true };
  });

export default updateSubject;