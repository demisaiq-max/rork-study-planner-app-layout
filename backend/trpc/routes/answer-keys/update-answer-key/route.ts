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

export const updateAnswerKeyProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string().uuid(),
      templateName: z.string().min(1).optional(),
      subject: z.enum(['korean', 'mathematics', 'english', 'others']).optional(),
      testType: z.enum(['practice', 'mock', 'midterm', 'final']).optional(),
      totalQuestions: z.number().int().min(1).max(200).optional(),
      mcqQuestions: z.number().int().min(0).optional(),
      textQuestions: z.number().int().min(0).optional(),
      description: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('[answer-keys/update] input', input);
    const userId = ctx.userId as string;
    await assertAdmin(userId);

    const updates: Record<string, unknown> = {};
    if (input.templateName !== undefined) updates.template_name = input.templateName;
    if (input.subject !== undefined) updates.subject = input.subject;
    if (input.testType !== undefined) updates.test_type = input.testType;
    if (input.totalQuestions !== undefined) updates.total_questions = input.totalQuestions;
    if (input.mcqQuestions !== undefined) updates.mcq_questions = input.mcqQuestions;
    if (input.textQuestions !== undefined) updates.text_questions = input.textQuestions;
    if (input.description !== undefined) updates.description = input.description;
    if (input.isActive !== undefined) updates.is_active = input.isActive;

    const { data, error } = await supabase
      .from('answer_key_templates')
      .update(updates)
      .eq('id', input.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating answer key', error);
      throw new Error(`Failed to update answer key: ${error.message}`);
    }



    console.log('[answer-keys/update] updated id', data.id);
    return data;
  });

export default updateAnswerKeyProcedure;