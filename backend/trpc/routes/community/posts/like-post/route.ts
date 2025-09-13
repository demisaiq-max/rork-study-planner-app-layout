import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const likePostProcedure = protectedProcedure
  .input(
    z.object({
      postId: z.string().uuid(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', input.postId)
      .eq('user_id', ctx.userId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', input.postId)
        .eq('user_id', ctx.userId);

      if (error) {
        console.error('Error unliking post:', error);
        throw new Error('Failed to unlike post');
      }

      return { liked: false };
    } else {
      // Like
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: input.postId,
          user_id: ctx.userId,
        });

      if (error) {
        console.error('Error liking post:', error);
        throw new Error('Failed to like post');
      }

      return { liked: true };
    }
  });