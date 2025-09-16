import { z } from 'zod';
import { protectedProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const createGroupProcedure = protectedProcedure
  .input(
    z.object({
      name: z.string().min(1, 'Group name is required'),
      description: z.string().optional(),
      subject: z.string().optional(),
      maxMembers: z.number().min(2).max(100).default(50),
      isPublic: z.boolean().default(true),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Check if group name already exists
    const { data: existingGroup } = await supabase
      .from('study_groups')
      .select('id')
      .eq('name', input.name)
      .single();

    if (existingGroup) {
      throw new Error('A group with this name already exists');
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .insert({
        name: input.name,
        description: input.description,
        subject: input.subject,
        max_members: input.maxMembers,
        is_public: input.isPublic,
        created_by: userId,
        member_count: 1, // Creator is automatically a member
      })
      .select()
      .single();

    if (groupError) {
      console.error('Error creating group:', groupError);
      throw new Error('Failed to create group');
    }

    // Add creator as first member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin',
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Error adding creator as member:', memberError);
      // Don't throw error here as group is already created
    }

    return group;
  });