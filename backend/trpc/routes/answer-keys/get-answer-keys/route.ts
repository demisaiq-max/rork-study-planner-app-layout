import { publicProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';
import { supabase } from '@/backend/lib/supabase';

export const getAnswerKeysProcedure = publicProcedure
  .input(
    z.object({
      subject: z.enum(['korean', 'mathematics', 'english', 'others']).optional(),
      testType: z.enum(['mock', 'midterm', 'final']).optional(),
      search: z.string().optional(),
      includeStats: z.boolean().optional(),
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
    }).optional()
  )
  .query(async ({ input }) => {
    console.log('[answer-keys/get] input', input);

    const useSummary = input?.includeStats ?? true;
    const table = useSummary ? 'answer_key_summary' : 'answer_key_templates';

    let query = supabase.from(table).select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (input?.subject) query = query.eq('subject', input.subject);
    if (input?.testType) query = query.eq('test_type', input.testType);
    if (input?.search) query = query.ilike('template_name', `%${input.search}%`);
    if (input?.limit !== undefined) query = query.limit(input.limit);
    if (input?.offset !== undefined) query = query.range(input.offset, (input.offset + (input.limit ?? 20)) - 1);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching answer keys', error);
      throw new Error(`Failed to fetch answer keys: ${error.message}`);
    }

    return data ?? [];
  });

export default getAnswerKeysProcedure;