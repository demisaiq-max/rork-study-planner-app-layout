import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const leaveGroupProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().uuid(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', input.groupId)
      .eq('user_id', ctx.userId);

    if (error) {
      console.error('Error leaving group:', error);
      throw new Error('Failed to leave group');
    }

    return { success: true };
  });