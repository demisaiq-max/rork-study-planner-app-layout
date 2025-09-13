import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const addCommentProcedure = protectedProcedure
  .input(
    z.object({
      postId: z.string().uuid(),
      content: z.string().min(1).max(1000),
      parentCommentId: z.string().uuid().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
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
      throw new Error('Failed to add comment');
    }

    return data;
  });