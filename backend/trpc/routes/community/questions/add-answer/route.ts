import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';
import { supabase } from '@/lib/supabase';

export const addAnswerProcedure = protectedProcedure
  .input(
    z.object({
      questionId: z.string().uuid(),
      content: z.string().min(10).max(5000),
      imageUrls: z.array(z.string().url()).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { data, error } = await supabase
      .from('answers')
      .insert({
        question_id: input.questionId,
        user_id: ctx.userId,
        content: input.content,
        image_urls: input.imageUrls,
      })
      .select(`
        *,
        user:users!answers_user_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Error adding answer:', error);
      throw new Error('Failed to add answer');
    }

    return data;
  });