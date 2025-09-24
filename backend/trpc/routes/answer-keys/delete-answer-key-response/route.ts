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

export const deleteAnswerKeyResponseProcedure = protectedProcedure
  .input(
    z.object({
      answerKeyId: z.string().uuid(),
      questionNumber: z.number().int().min(1),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('[answer-keys/delete-response] q#', input.questionNumber);
    const userId = ctx.userId as string;
    await assertAdmin(userId);

    const { error } = await supabase
      .from('answer_key_responses')
      .delete()
      .match({ answer_key_id: input.answerKeyId, question_number: input.questionNumber });

    if (error) {
      console.error('Error deleting response', error);
      throw new Error(`Failed to delete response: ${error.message}`);
    }

    return { success: true };
  });

export default deleteAnswerKeyResponseProcedure;