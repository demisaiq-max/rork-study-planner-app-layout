import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';
import { supabase } from '@/lib/supabase';
import { TRPCError } from '@trpc/server';

export const addCommentProcedure = protectedProcedure
  .input(
    z.object({
      postId: z.string().uuid(),
      content: z.string().min(1).max(1000),
      parentCommentId: z.string().uuid().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      console.log('Add comment request:', { postId: input.postId, userId: ctx.userId, content: input.content });
      
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

      // Insert the comment
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: input.postId,
          user_id: ctx.userId,
          content: input.content,
          parent_comment_id: input.parentCommentId,
        })
        .select(`
          *,
          user:users!post_comments_user_id_fkey(id, name)
        `)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add comment',
        });
      }

      console.log('Comment added successfully:', data);
      return data;
    } catch (error) {
      console.error('Add comment procedure error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      });
    }
  });