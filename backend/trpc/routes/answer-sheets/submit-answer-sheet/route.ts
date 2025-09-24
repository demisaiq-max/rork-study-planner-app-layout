import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

type SheetRow = {
  id: string;
  user_id: string;
  subject: 'korean' | 'mathematics' | 'english' | 'others';
  subject_id: string | null;
  sheet_name: string;
  test_type: 'practice' | 'mock' | 'midterm' | 'final';
  total_questions: number;
  mcq_questions: number;
  text_questions: number;
  status: 'draft' | 'submitted' | 'graded';
  submitted_at?: string | null;
};

export const submitAnswerSheetProcedure = publicProcedure
  .input(z.object({
    sheetId: z.string(),
    answers: z.array(z.object({
      questionNumber: z.number(),
      questionType: z.enum(['mcq', 'text']),
      mcqOption: z.number().min(1).max(5).optional(),
      textAnswer: z.string().optional(),
    })),
  }))
  .mutation(async ({ input }) => {
    console.log('Submitting answer sheet:', input.sheetId, 'with', input.answers.length, 'answers');

    const { data: sheet, error: sheetError } = await supabase
      .from('answer_sheets')
      .select('*')
      .eq('id', input.sheetId)
      .single<SheetRow>();

    if (sheetError) {
      console.error('Error getting answer sheet:', sheetError);
      throw new Error(`Failed to get answer sheet: ${sheetError.message}`);
    }

    if (sheet.status !== 'draft') {
      throw new Error('Answer sheet has already been submitted');
    }

    const responsePromises = input.answers.map(async (answer) => {
      const responseData: Record<string, any> = {
        answer_sheet_id: input.sheetId,
        question_number: answer.questionNumber,
        question_type: answer.questionType,
      };

      if (answer.questionType === 'mcq') {
        responseData.mcq_option = answer.mcqOption ?? null;
        responseData.text_answer = null;
      } else {
        responseData.text_answer = answer.textAnswer ?? null;
        responseData.mcq_option = null;
      }

      return supabase
        .from('answer_sheet_responses')
        .upsert(responseData, {
          onConflict: 'answer_sheet_id,question_number'
        });
    });

    const responses = await Promise.all(responsePromises);
    const responseErrors = responses.filter(r => (r as any).error);
    if (responseErrors.length > 0) {
      console.error('Error saving responses:', responseErrors);
      throw new Error('Failed to save some answers');
    }

    const { data: updatedSheet, error: updateError } = await supabase
      .from('answer_sheets')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', input.sheetId)
      .select('*')
      .single<SheetRow>();

    if (updateError) {
      console.error('Error updating answer sheet status:', updateError);
      throw new Error(`Failed to submit answer sheet: ${updateError.message}`);
    }

    console.log('Answer sheet submitted successfully:', updatedSheet?.id);

    try {
      console.log('Attempting auto-grade flow...');
      const { data: key, error: keyErr } = await supabase
        .from('answer_key_templates')
        .select('*')
        .eq('subject', sheet.subject)
        .eq('test_type', sheet.test_type === 'practice' ? 'mock' : sheet.test_type)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (keyErr) {
        console.warn('No key found or error loading key', keyErr);
      }

      if (key?.id) {
        console.log('Found answer key template', key.id, 'computing score...');

        const [{ data: keyResponses }, { data: userResponses }] = await Promise.all([
          supabase
            .from('answer_key_responses')
            .select('*')
            .eq('answer_key_id', key.id),
          supabase
            .from('answer_sheet_responses')
            .select('*')
            .eq('answer_sheet_id', sheet.id),
        ]);

        const keyByQ = new Map<number, any>();
        (keyResponses ?? []).forEach((r) => keyByQ.set(r.question_number, r));

        let correct = 0;
        (userResponses ?? []).forEach((r) => {
          const k = keyByQ.get(r.question_number);
          if (!k) return;
          if (r.question_type === 'mcq' && k.correct_mcq_option && r.mcq_option) {
            if (Number(r.mcq_option) === Number(k.correct_mcq_option)) correct += Number(k.points_value ?? 1);
          } else if (r.question_type === 'text' && k.correct_text_answers && r.text_answer) {
            const answers: string[] = k.correct_text_answers as string[];
            if (answers.map((s) => String(s).trim().toLowerCase()).includes(String(r.text_answer).trim().toLowerCase())) {
              correct += Number(k.points_value ?? 1);
            }
          }
        });

        const total = Number(key.total_questions ?? sheet.total_questions ?? 0) || 0;
        console.log('Auto-grade result', { correct, total });

        const scoreUpdate = await supabase
          .from('answer_sheets')
          .update({ status: 'graded', score: correct, grade: null })
          .eq('id', sheet.id);
        if (scoreUpdate.error) console.warn('Failed to update sheet score', scoreUpdate.error);

        const testName = sheet.sheet_name;
        const { data: testRow, error: testErr } = await supabase
          .from('tests')
          .upsert({
            user_id: sheet.user_id,
            subject: sheet.subject,
            test_type: sheet.test_type === 'practice' ? 'mock' : sheet.test_type,
            test_name: testName,
            test_date: new Date().toISOString().slice(0, 10),
          }, { onConflict: 'user_id,subject,test_type,test_name' })
          .select('*')
          .single();
        if (testErr) {
          console.warn('Failed to upsert test row', testErr);
        } else if (testRow?.id) {
          const { error: resErr } = await supabase
            .from('test_results')
            .upsert({
              test_id: testRow.id,
              user_id: sheet.user_id,
              raw_score: correct,
              standard_score: null,
              percentile: null,
              grade: null,
              analysis_data: null,
            }, { onConflict: 'test_id,user_id' });
          if (resErr) console.warn('Failed to upsert test result', resErr);
        }
      } else {
        console.log('No matching active answer key; skipping auto-grade');
      }
    } catch (e) {
      console.error('Auto-grade flow failed silently', e);
    }

    return updatedSheet;
  });

export default submitAnswerSheetProcedure;