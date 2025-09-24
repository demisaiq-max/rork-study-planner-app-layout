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

const ResponseSchema = z.object({
  questionNumber: z.number().int().min(1),
  questionType: z.enum(['mcq', 'text']),
  correctMcqOption: z.number().int().min(1).max(5).optional(),
  correctTextAnswers: z.array(z.string()).optional(),
  pointsValue: z.number().min(0).default(1),
  explanation: z.string().optional(),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

export const upsertAnswerKeyResponsesProcedure = protectedProcedure
  .input(
    z.object({
      answerKeyId: z.string().uuid(),
      responses: z.array(ResponseSchema).min(1),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('[answer-keys/upsert-responses] input.len', input.responses.length);
    const userId = ctx.userId as string;
    await assertAdmin(userId);

    const rows = input.responses.map((r) => ({
      answer_key_id: input.answerKeyId,
      question_number: r.questionNumber,
      question_type: r.questionType,
      correct_mcq_option: r.questionType === 'mcq' ? (r.correctMcqOption ?? null) : null,
      correct_text_answers: r.questionType === 'text' ? (r.correctTextAnswers ?? null) : null,
      points_value: r.pointsValue,
      explanation: r.explanation ?? null,
      difficulty_level: r.difficultyLevel,
    }));

    const { data, error } = await supabase
      .from('answer_key_responses')
      .upsert(rows, { onConflict: 'answer_key_id,question_number' })
      .select('*');

    if (error) {
      console.error('Error upserting responses', error);
      throw new Error(`Failed to save responses: ${error.message}`);
    }

    return data;
  });

export default upsertAnswerKeyResponsesProcedure;