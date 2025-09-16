import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const likeAnswerProcedure = protectedProcedure
  .input(
    z.object({
      answerId: z.string().uuid(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Check if user already liked this answer
    const { data: existingLike } = await supabase
      .from('answer_likes')
      .select('id')
      .eq('answer_id', input.answerId)
      .eq('user_id', ctx.userId)
      .single();

    if (existingLike) {
      // Unlike the answer
      const { error } = await supabase
        .from('answer_likes')
        .delete()
        .eq('answer_id', input.answerId)
        .eq('user_id', ctx.userId);

      if (error) {
        console.error('Error unliking answer:', error);
        throw new Error('Failed to unlike answer');
      }

      return { liked: false };
    } else {
      // Like the answer
      const { error } = await supabase
        .from('answer_likes')
        .insert({
          answer_id: input.answerId,
          user_id: ctx.userId,
        });

      if (error) {
        console.error('Error liking answer:', error);
        throw new Error('Failed to like answer');
      }

      return { liked: true };
    }
  });