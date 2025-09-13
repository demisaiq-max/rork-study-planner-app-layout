import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';
import { supabase } from '@/lib/supabase';

export const joinGroupProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().uuid(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Check if already member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', input.groupId)
      .eq('user_id', ctx.userId)
      .single();

    if (existingMember) {
      throw new Error('Already a member of this group');
    }

    // Join group
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: input.groupId,
        user_id: ctx.userId,
        role: 'member',
      })
      .select()
      .single();

    if (error) {
      console.error('Error joining group:', error);
      throw new Error('Failed to join group');
    }

    return data;
  });