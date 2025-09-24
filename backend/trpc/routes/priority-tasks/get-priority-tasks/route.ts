import { protectedProcedure } from '@/backend/trpc/create-context';

export const getPriorityTasksProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('priority_tasks')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching priority tasks:', error);
      throw new Error('Failed to fetch priority tasks');
    }

    return data || [];
  });