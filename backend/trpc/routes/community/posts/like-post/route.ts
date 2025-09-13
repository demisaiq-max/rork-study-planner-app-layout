import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { TRPCError } from '@trpc/server';

export const likePostProcedure = protectedProcedure
  .input(
    z.object({
      postId: z.string().uuid(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      console.log('Like post request:', { postId: input.postId, userId: ctx.userId });
      
      // First verify the post exists
      const { data: post, error: postError } = await supabase
        .from('daily_posts')
        .select('id')
        .eq('id', input.postId)
        .single();

      if (postError || !post) {
        console.error('Post not found:', postError);
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      // Check if already liked
      const { data: existingLike, error: likeCheckError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', input.postId)
        .eq('user_id', ctx.userId)
        .maybeSingle();

      if (likeCheckError) {
        console.error('Error checking existing like:', likeCheckError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check like status',
        });
      }

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', input.postId)
          .eq('user_id', ctx.userId);

        if (deleteError) {
          console.error('Error unliking post:', deleteError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to unlike post',
          });
        }

        console.log('Post unliked successfully');
        return { liked: false };
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({
            post_id: input.postId,
            user_id: ctx.userId,
          });

        if (insertError) {
          console.error('Error liking post:', insertError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to like post',
          });
        }

        console.log('Post liked successfully');
        return { liked: true };
      }
    } catch (error) {
      console.error('Like post procedure error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      });
    }
  });