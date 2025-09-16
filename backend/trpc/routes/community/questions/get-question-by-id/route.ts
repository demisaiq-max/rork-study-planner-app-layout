import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const getQuestionByIdProcedure = publicProcedure
  .input(
    z.object({
      questionId: z.string().uuid(),
    })
  )
  .query(async ({ input }) => {
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select(`
        *,
        user:users!questions_user_id_fkey(id, name, profile_picture_url),
        likes:question_likes(user_id),
        answers:answers(
          *,
          user:users!answers_user_id_fkey(id, name, profile_picture_url),
          likes:answer_likes(user_id)
        )
      `)
      .eq('id', input.questionId)
      .single();

    if (questionError) {
      console.error('Error fetching question:', questionError);
      throw new Error('Failed to fetch question');
    }

    return question;
  });