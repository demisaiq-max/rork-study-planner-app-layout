import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';
import { mapSubjectNameToEnum, isValidRawScore, SubjectEnum } from '@/backend/lib/subjects';

export const submitTestResult = publicProcedure
  .input(z.object({
    testId: z.string(),
    userId: z.string(),
    rawScore: z.number().nullable().optional(),
    standardScore: z.number().nullable().optional(),
    percentile: z.number().nullable().optional(),
    grade: z.number().min(1).max(9).nullable().optional(),
    answerSheetImageUrl: z.string().optional(),
    analysisData: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    console.log('[tests/submit-test-result] incoming', input);

    const { data: testRow, error: testErr } = await supabase
      .from('tests')
      .select('id, subject, test_type, test_name')
      .eq('id', input.testId)
      .single<{ id: string; subject: SubjectEnum | string; test_type: string; test_name: string }>();

    if (testErr || !testRow) {
      console.error('[tests/submit-test-result] failed to load test', testErr);
      throw new Error('Unable to find the referenced test');
    }

    const subjectEnum: SubjectEnum = mapSubjectNameToEnum(String(testRow.subject ?? ''));


    if (input.rawScore !== undefined && input.rawScore !== null) {
      if (!isValidRawScore(subjectEnum, input.rawScore)) {
        console.warn('[tests/submit-test-result] invalid raw score', { subjectEnum, raw: input.rawScore });
        throw new Error('Invalid raw score for selected subject');
      }
    }

    const safePercentile = input.percentile ?? null;
    if (safePercentile !== null) {
      if (typeof safePercentile !== 'number' || safePercentile < 0 || safePercentile > 100) {
        throw new Error('Percentile must be between 0 and 100');
      }
    }

    const { data, error } = await supabase
      .from('test_results')
      .upsert({
        test_id: input.testId,
        user_id: input.userId,
        raw_score: input.rawScore ?? null,
        standard_score: input.standardScore ?? null,
        percentile: safePercentile,
        grade: input.grade ?? null,
        answer_sheet_image_url: input.answerSheetImageUrl,
        analysis_data: input.analysisData ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit test result: ${error.message}`);
    }

    console.log('[tests/submit-test-result] saved result for', testRow.subject, testRow.test_name);
    return data;
  });

export default submitTestResult;