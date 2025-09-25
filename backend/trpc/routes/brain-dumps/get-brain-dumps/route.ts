import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';

export const getBrainDumpsProcedure = protectedProcedure
  .input(z.object({
    limit: z.number().optional().default(10),
    offset: z.number().optional().default(0),
    userId: z.string().uuid().optional(),
  }).optional())
  .query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 10;
    const offset = input?.offset ?? 0;

    const { data, error } = await ctx.supabase
      .from('brain_dumps')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching brain dumps:', error);
      throw new Error(error.message || 'Failed to fetch brain dumps');
    }

    return data || [];
  });