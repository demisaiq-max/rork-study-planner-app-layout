import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const submitTestResult = publicProcedure
  .input(z.object({
    testId: z.string(),
    userId: z.string(),
    rawScore: z.number().optional(),
    standardScore: z.number().optional(),
    percentile: z.number().optional(),
    grade: z.number().min(1).max(9).optional(),
    answerSheetImageUrl: z.string().optional(),
    analysisData: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    const { data, error } = await supabase
      .from('test_results')
      .upsert({
        test_id: input.testId,
        user_id: input.userId,
        raw_score: input.rawScore,
        standard_score: input.standardScore,
        percentile: input.percentile,
        grade: input.grade,
        answer_sheet_image_url: input.answerSheetImageUrl,
        analysis_data: input.analysisData
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit test result: ${error.message}`);
    }

    return data;
  });

export default submitTestResult;