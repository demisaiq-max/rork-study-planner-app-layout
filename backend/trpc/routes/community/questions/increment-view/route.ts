import { z } from 'zod';
import { publicProcedure } from '../../../../create-context';
import { supabase } from '@/lib/supabase';

export const incrementQuestionViewProcedure = publicProcedure
  .input(
    z.object({
      questionId: z.string().uuid(),
    })
  )
  .mutation(async ({ input }) => {
    // First get current view count
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('views_count')
      .eq('id', input.questionId)
      .single();

    if (fetchError) {
      console.error('Error fetching question:', fetchError);
      throw new Error('Failed to fetch question');
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from('questions')
      .update({ views_count: (question?.views_count || 0) + 1 })
      .eq('id', input.questionId);
    
    if (updateError) {
      console.error('Error updating view count:', updateError);
      throw new Error('Failed to increment view count');
    }

    return { success: true, newCount: (question?.views_count || 0) + 1 };
  });