import { z } from 'zod';
import { publicProcedure } from '../../../../create-context';
import { supabase } from '@/lib/supabase';

export const incrementViewProcedure = publicProcedure
  .input(
    z.object({
      postId: z.string().uuid(),
    })
  )
  .mutation(async ({ input }) => {
    // First get current view count
    const { data: post, error: fetchError } = await supabase
      .from('daily_posts')
      .select('views_count')
      .eq('id', input.postId)
      .single();

    if (fetchError) {
      console.error('Error fetching post:', fetchError);
      throw new Error('Failed to fetch post');
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from('daily_posts')
      .update({ views_count: (post?.views_count || 0) + 1 })
      .eq('id', input.postId);
    
    if (updateError) {
      console.error('Error updating view count:', updateError);
      throw new Error('Failed to increment view count');
    }

    return { success: true, newCount: (post?.views_count || 0) + 1 };
  });