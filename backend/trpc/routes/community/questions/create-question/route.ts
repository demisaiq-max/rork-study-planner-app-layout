import { z } from 'zod';
import { protectedProcedure } from '../../../../create-context';
import { supabase } from '@/lib/supabase';

export const createQuestionProcedure = protectedProcedure
  .input(
    z.object({
      title: z.string().min(5).max(500),
      content: z.string().min(10).max(5000),
      subject: z.string().optional(),
      tags: z.array(z.string()).optional(),
      imageUrls: z.array(z.string().url()).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { data, error } = await supabase
      .from('questions')
      .insert({
        user_id: ctx.userId,
        title: input.title,
        content: input.content,
        subject: input.subject,
        tags: input.tags,
        image_urls: input.imageUrls,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating question:', error);
      throw new Error('Failed to create question');
    }

    return data;
  });