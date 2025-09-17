import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';

export const getGroupsProcedure = publicProcedure
  .input(
    z.object({
      userId: z.string().uuid().optional(),
      searchQuery: z.string().optional(),
    })
  )
  .query(async ({ input, ctx }) => {
    let query = ctx.supabase
      .from('study_groups')
      .select(`
        *,
        creator:users!study_groups_created_by_fkey(id, name),
        members:group_members(user_id)
      `)
      .order('created_at', { ascending: false });

    if (input.searchQuery) {
      query = query.or(`name.ilike.%${input.searchQuery}%,description.ilike.%${input.searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching groups:', error);
      throw new Error('Failed to fetch groups');
    }

    // If userId provided, mark which groups user is member of
    if (input.userId && data) {
      return data.map(group => ({
        ...group,
        isMember: group.members?.some((m: any) => m.user_id === input.userId) || false,
      }));
    }

    return data || [];
  });