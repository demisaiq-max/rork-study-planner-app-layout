import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const addAnswerCommentProcedure = protectedProcedure
  .input(
    z.object({
      answerId: z.string().uuid(),
      content: z.string().min(1).max(1000),
      imageUrls: z.array(z.string().url()).optional(),
      parentCommentId: z.string().uuid().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { data, error } = await supabase
      .from('answer_comments')
      .insert({
        answer_id: input.answerId,
        user_id: ctx.userId,
        content: input.content,
        image_urls: input.imageUrls,
        parent_comment_id: input.parentCommentId,
      })
      .select(`
        *,
        user:users!answer_comments_user_id_fkey(id, name, profile_picture_url)
      `)
      .single();

    if (error) {
      console.error('Error adding answer comment:', error);
      throw new Error('Failed to add comment');
    }

    return data;
  });