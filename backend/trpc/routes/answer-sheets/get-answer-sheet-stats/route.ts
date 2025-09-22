import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const getAnswerSheetStatsProcedure = publicProcedure
  .input(z.object({
    sheetId: z.string(),
  }))
  .query(async ({ input }) => {
    console.log('Getting answer sheet stats for:', input.sheetId);
    
    // Use the database function to get stats
    const { data, error } = await supabase
      .rpc('get_answer_sheet_stats', { sheet_id: input.sheetId });

    if (error) {
      console.error('Error getting answer sheet stats:', error);
      throw new Error(`Failed to get answer sheet stats: ${error.message}`);
    }

    const stats = data?.[0] || {
      total_answered: 0,
      mcq_answered: 0,
      text_answered: 0,
      completion_percentage: 0
    };

    console.log('Retrieved answer sheet stats:', stats);
    return stats;
  });

export default getAnswerSheetStatsProcedure;