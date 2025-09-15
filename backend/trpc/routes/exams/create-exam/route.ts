import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';

export const createExam = protectedProcedure
  .input(z.object({
    title: z.string(),
    date: z.string(),
    subject: z.string(),
    priority: z.boolean().optional().default(false),
  }))
  .mutation(async ({ input, ctx }) => {
    const { data, error } = await ctx.supabase
      .from('exams')
      .insert({
        user_id: ctx.userId,
        title: input.title,
        date: input.date,
        subject: input.subject,
        priority: input.priority,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create exam: ${error.message}`);
    }

    return data;
  });

export default createExam;