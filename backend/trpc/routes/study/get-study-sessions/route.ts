import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const getStudySessions = publicProcedure
  .input(z.object({ 
    userId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }))
  .query(async ({ input }) => {
    let query = supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', input.userId)
      .order('date', { ascending: false });

    if (input.startDate) {
      query = query.gte('date', input.startDate);
    }
    
    if (input.endDate) {
      query = query.lte('date', input.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch study sessions: ${error.message}`);
    }

    return data || [];
  });

export default getStudySessions;