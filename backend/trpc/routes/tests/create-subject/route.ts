import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const createSubject = publicProcedure
  .input(z.object({ 
    userId: z.string(),
    subject: z.string()
  }))
  .mutation(async ({ input }) => {
    // Check if subject already exists for this user
    const { data: existingTests } = await supabase
      .from('tests')
      .select('id')
      .eq('user_id', input.userId)
      .eq('subject', input.subject)
      .limit(1);

    if (existingTests && existingTests.length > 0) {
      throw new Error('Subject already exists');
    }

    // Create a placeholder test for this subject to establish it in the system
    const { data, error } = await supabase
      .from('tests')
      .insert({
        user_id: input.userId,
        subject: input.subject,
        test_type: 'mock',
        test_name: 'Placeholder Test',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subject: ${error.message}`);
    }

    return data;
  });

export default createSubject;