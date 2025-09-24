import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { ensureUserExists } from '@/backend/lib/user-utils';

export const createBrainDumpProcedure = protectedProcedure
  .input(z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    category: z.string().optional(),
    is_pinned: z.boolean().optional().default(false),
    is_completed: z.boolean().optional().default(false),
  }))
  .mutation(async ({ ctx, input }) => {
    // Ensure user exists in the database first
    await ensureUserExists(ctx.supabase, ctx.userId, ctx.user);

    const { data, error } = await ctx.supabase
      .from('brain_dumps')
      .insert({
        user_id: ctx.userId,
        title: input.title,
        content: input.content,
        category: input.category ?? null,
        is_pinned: input.is_pinned ?? false,
        is_completed: input.is_completed ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating brain dump:', error);
      throw new Error(error.message || 'Failed to create brain dump');
    }

    return data;
  });