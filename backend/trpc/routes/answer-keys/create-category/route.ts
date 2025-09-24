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

export const createAnswerKeyCategoryProcedure = protectedProcedure
  .input(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('[answer-keys/categories/create] input', input);
    const userId = ctx.userId as string;
    await assertAdmin(userId);

    const { data, error } = await supabase
      .from('answer_key_categories')
      .insert({ name: input.name, description: input.description ?? null, color: input.color ?? '#007AFF' })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating category', error);
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  });

export default createAnswerKeyCategoryProcedure;