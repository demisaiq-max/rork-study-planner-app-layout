import { publicProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';
import { supabase } from '@/backend/lib/supabase';

export const getAnswerKeyStatsProcedure = publicProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input }) => {
    console.log('[answer-keys/stats] id', input.id);

    const { data, error } = await supabase.rpc('get_answer_key_stats', { p_answer_key_id: input.id });

    if (error) {
      console.error('Error fetching answer key stats', error);
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }

    return data?.[0] ?? null;
  });

export default getAnswerKeyStatsProcedure;