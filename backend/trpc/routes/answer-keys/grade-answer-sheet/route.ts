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

export const gradeAnswerSheetProcedure = protectedProcedure
  .input(
    z.object({
      answerSheetId: z.string().uuid(),
      answerKeyId: z.string().uuid(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('[answer-keys/grade] sheet', input.answerSheetId, 'key', input.answerKeyId);
    const userId = ctx.userId as string;
    await assertAdmin(userId);

    const { data, error } = await supabase.rpc('auto_grade_answer_sheet', {
      p_answer_sheet_id: input.answerSheetId,
      p_answer_key_id: input.answerKeyId,
      p_graded_by: userId,
    });

    if (error) {
      console.error('Error grading answer sheet', error);
      throw new Error(`Failed to grade: ${error.message}`);
    }

    return data;
  });

export default gradeAnswerSheetProcedure;