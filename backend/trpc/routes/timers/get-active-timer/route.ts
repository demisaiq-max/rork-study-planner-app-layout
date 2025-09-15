import { protectedProcedure } from '@/backend/trpc/create-context';

export const getActiveTimerProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    try {
      // Get the most recent timer session that is not completed
      const { data, error } = await ctx.supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', ctx.userId)
        .eq('is_completed', false)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching active timer:', error);
        throw new Error(`Failed to fetch active timer: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Error in getActiveTimer:', err);
      return null; // Return null if no active timer found
    }
  });