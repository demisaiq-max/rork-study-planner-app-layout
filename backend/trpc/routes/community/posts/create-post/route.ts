import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';
import { supabase } from '@/lib/supabase';

export const createPostProcedure = protectedProcedure
  .input(
    z.object({
      content: z.string().min(1).max(5000),
      groupId: z.string().uuid().optional(),
      studyHours: z.number().min(0).max(24).optional(),
      subjectsStudied: z.array(z.string()).optional(),
      mood: z.string().optional(),
      imageUrl: z.string().url().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { data, error } = await supabase
      .from('daily_posts')
      .insert({
        user_id: ctx.userId,
        content: input.content,
        group_id: input.groupId,
        study_hours: input.studyHours,
        subjects_studied: input.subjectsStudied,
        mood: input.mood,
        image_url: input.imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    }

    return data;
  });