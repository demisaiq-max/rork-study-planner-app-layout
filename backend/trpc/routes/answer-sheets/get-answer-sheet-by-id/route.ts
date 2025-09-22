import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const getAnswerSheetByIdProcedure = publicProcedure
  .input(z.object({
    sheetId: z.string(),
  }))
  .query(async ({ input }) => {
    console.log('Getting answer sheet by ID:', input.sheetId);
    
    // Get the answer sheet details
    const { data: sheet, error: sheetError } = await supabase
      .from('answer_sheets')
      .select('*')
      .eq('id', input.sheetId)
      .single();

    if (sheetError) {
      console.error('Error getting answer sheet:', sheetError);
      throw new Error(`Failed to get answer sheet: ${sheetError.message}`);
    }

    // Get all responses for this sheet
    const { data: responses, error: responsesError } = await supabase
      .from('answer_sheet_responses')
      .select('*')
      .eq('answer_sheet_id', input.sheetId)
      .order('question_number', { ascending: true });

    if (responsesError) {
      console.error('Error getting answer sheet responses:', responsesError);
      throw new Error(`Failed to get answer sheet responses: ${responsesError.message}`);
    }

    console.log('Retrieved answer sheet with', responses?.length || 0, 'responses');
    return {
      ...sheet,
      responses: responses || []
    };
  });

export default getAnswerSheetByIdProcedure;