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

export const deleteAnswerKeyProcedure = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ input, ctx }) => {
    console.log('[answer-keys/delete] id', input.id);
    const userId = ctx.userId as string;
    await assertAdmin(userId);

    const { error } = await supabase
      .from('answer_key_templates')
      .delete()
      .eq('id', input.id);

    if (error) {
      console.error('Error deleting answer key', error);
      throw new Error(`Failed to delete answer key: ${error.message}`);
    }

    return { success: true };
  });

export default deleteAnswerKeyProcedure;