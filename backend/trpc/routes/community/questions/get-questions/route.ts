import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const getQuestionsProcedure = publicProcedure
  .input(
    z.object({
      subject: z.string().optional(),
      searchQuery: z.string().optional(),
      isSolved: z.boolean().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    })
  )
  .query(async ({ input }) => {
    let query = supabase
      .from('questions')
      .select(`
        *,
        user:users!questions_user_id_fkey(id, name),
        likes:question_likes(user_id),
        answers:answers(id)
      `)
      .order('created_at', { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (input.subject) {
      query = query.eq('subject', input.subject);
    }

    if (input.isSolved !== undefined) {
      query = query.eq('is_solved', input.isSolved);
    }

    if (input.searchQuery) {
      query = query.or(`title.ilike.%${input.searchQuery}%,content.ilike.%${input.searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      throw new Error('Failed to fetch questions');
    }

    return data || [];
  });