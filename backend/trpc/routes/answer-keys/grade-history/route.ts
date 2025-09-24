import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';
import { supabase } from '@/backend/lib/supabase';

export const getGradeHistoryProcedure = protectedProcedure
  .input(
    z.object({
      answerSheetId: z.string().uuid().optional(),
      answerKeyId: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
    }).optional()
  )
  .query(async ({ input }) => {
    console.log('[answer-keys/grade-history] input', input);

    let query = supabase
      .from('answer_key_usage_logs')
      .select('*, answer_key_templates(*), answer_sheets(*)')
      .order('graded_at', { ascending: false });

    if (input?.answerSheetId) query = query.eq('answer_sheet_id', input.answerSheetId);
    if (input?.answerKeyId) query = query.eq('answer_key_id', input.answerKeyId);
    if (input?.offset !== undefined && input?.limit !== undefined) {
      query = query.range(input.offset, input.offset + input.limit - 1);
    } else if (input?.limit) {
      query = query.limit(input.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching grade history', error);
      throw new Error(`Failed to fetch grade history: ${error.message}`);
    }

    return data ?? [];
  });

export default getGradeHistoryProcedure;