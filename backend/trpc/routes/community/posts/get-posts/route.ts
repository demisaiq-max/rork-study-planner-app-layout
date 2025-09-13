import { z } from 'zod';
import { publicProcedure } from '../../../../create-context';
import { supabase } from '@/lib/supabase';

export const getPostsProcedure = publicProcedure
  .input(
    z.object({
      groupId: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    })
  )
  .query(async ({ input }) => {
    let query = supabase
      .from('daily_posts')
      .select(`
        *,
        user:users!daily_posts_user_id_fkey(id, name, email),
        group:study_groups!daily_posts_group_id_fkey(id, name),
        likes:post_likes(user_id),
        comments:post_comments(id, content, created_at, user:users!post_comments_user_id_fkey(id, name))
      `)
      .order('created_at', { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (input.groupId) {
      query = query.eq('group_id', input.groupId);
    }

    if (input.userId) {
      query = query.eq('user_id', input.userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
    }

    return data || [];
  });