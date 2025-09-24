import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';
import { supabase } from '@/backend/lib/supabase';

async function assertAdmin(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Failed to load user role', error);
    throw new Error('Unable to verify permissions');
  }
  if (!data || data.role !== 'admin') {
    throw new Error('Forbidden');
  }
}

export const createAnswerKeyProcedure = protectedProcedure
  .input(
    z.object({
      templateName: z.string().min(1),
      subject: z.enum(['korean', 'mathematics', 'english', 'others']),
      testType: z.enum(['mock', 'midterm', 'final']).default('mock'),
      totalQuestions: z.number().int().min(1).max(200),
      mcqQuestions: z.number().int().min(0).default(0),
      textQuestions: z.number().int().min(0).default(0),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('[answer-keys/create] input', input);
    const userId = ctx.userId as string;
    await assertAdmin(userId);

    const total = input.mcqQuestions + input.textQuestions;
    if (total !== input.totalQuestions) {
      console.warn('Adjusting totalQuestions to match mcq+text');
    }

    const { data, error } = await supabase
      .from('answer_key_templates')
      .insert({
        created_by: userId,
        template_name: input.templateName,
        subject: input.subject,
        test_type: input.testType,
        total_questions: input.totalQuestions,
        mcq_questions: input.mcqQuestions,
        text_questions: input.textQuestions,
        description: input.description ?? null,
        is_active: input.isActive ?? true,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating answer key', error);
      throw new Error(`Failed to create answer key: ${error.message}`);
    }



    console.log('[answer-keys/create] created id', data.id);
    return data;
  });

export default createAnswerKeyProcedure;