import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const likeAnswerCommentProcedure = protectedProcedure
  .input(
    z.object({
      commentId: z.string().uuid(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Check if user already liked this comment
    const { data: existingLike } = await supabase
      .from('answer_comment_likes')
      .select('id')
      .eq('comment_id', input.commentId)
      .eq('user_id', ctx.userId)
      .single();

    if (existingLike) {
      // Unlike the comment
      const { error } = await supabase
        .from('answer_comment_likes')
        .delete()
        .eq('comment_id', input.commentId)
        .eq('user_id', ctx.userId);

      if (error) {
        console.error('Error unliking answer comment:', error);
        throw new Error('Failed to unlike comment');
      }

      return { liked: false };
    } else {
      // Like the comment
      const { error } = await supabase
        .from('answer_comment_likes')
        .insert({
          comment_id: input.commentId,
          user_id: ctx.userId,
        });

      if (error) {
        console.error('Error liking answer comment:', error);
        throw new Error('Failed to like comment');
      }

      return { liked: true };
    }
  });