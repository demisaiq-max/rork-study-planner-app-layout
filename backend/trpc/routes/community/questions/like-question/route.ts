import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const likeQuestionProcedure = protectedProcedure
  .input(
    z.object({
      questionId: z.string().uuid(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('question_likes')
      .select('id')
      .eq('question_id', input.questionId)
      .eq('user_id', ctx.userId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('question_likes')
        .delete()
        .eq('question_id', input.questionId)
        .eq('user_id', ctx.userId);

      if (error) {
        console.error('Error unliking question:', error);
        throw new Error('Failed to unlike question');
      }

      return { liked: false };
    } else {
      // Like
      const { error } = await supabase
        .from('question_likes')
        .insert({
          question_id: input.questionId,
          user_id: ctx.userId,
        });

      if (error) {
        console.error('Error liking question:', error);
        throw new Error('Failed to like question');
      }

      return { liked: true };
    }
  });