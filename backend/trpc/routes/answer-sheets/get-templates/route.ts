import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const getTemplatesProcedure = publicProcedure
  .input(z.object({
    subject: z.enum(['korean', 'mathematics', 'english', 'others']).optional(),
  }))
  .query(async ({ input }) => {
    console.log('Getting answer sheet templates for subject:', input.subject);
    
    let query = supabase
      .from('answer_sheet_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (input.subject) {
      query = query.eq('subject', input.subject);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting templates:', error);
      throw new Error(`Failed to get templates: ${error.message}`);
    }

    console.log('Retrieved templates:', data?.length || 0);
    return data || [];
  });

export default getTemplatesProcedure;