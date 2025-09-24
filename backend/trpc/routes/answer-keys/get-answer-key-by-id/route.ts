import { publicProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';
import { supabase } from '@/backend/lib/supabase';

export const getAnswerKeyByIdProcedure = publicProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input }) => {
    console.log('[answer-keys/get-by-id] id', input.id);

    const { data, error } = await supabase
      .from('answer_key_templates')
      .select('*, answer_key_responses(*), answer_key_template_categories(*, answer_key_categories(*))')
      .eq('id', input.id)
      .single();

    if (error) {
      console.error('Error fetching answer key by id', error);
      throw new Error(`Failed to fetch answer key: ${error.message}`);
    }

    return data;
  });

export default getAnswerKeyByIdProcedure;