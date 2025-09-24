import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

function mapSubjectNameToEnum(name: string): 'korean' | 'mathematics' | 'english' | 'others' {
  const n = name.toLowerCase();
  if (n.includes('korean') || n.includes('국어')) return 'korean';
  if (n.includes('math') || n.includes('mathematics') || n.includes('수학')) return 'mathematics';
  if (n.includes('english') || n.includes('영어')) return 'english';
  return 'others';
}

export const createAnswerSheetProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    subject: z.enum(['korean', 'mathematics', 'english', 'others']).optional(),
    subjectId: z.string().uuid().optional(),
    sheetName: z.string(),
    testType: z.enum(['practice', 'mock', 'midterm', 'final']).default('practice'),
    totalQuestions: z.number().min(1).max(200),
    mcqQuestions: z.number().min(0).default(0),
    textQuestions: z.number().min(0).default(0),
  }))
  .mutation(async ({ input }) => {
    console.log('Creating answer sheet with unified subjects support:', input);

    let resolvedSubject: 'korean' | 'mathematics' | 'english' | 'others' | null = input.subject ?? null;
    let resolvedSubjectId: string | null = input.subjectId ?? null;

    if (!resolvedSubject || !resolvedSubjectId) {
      if (input.subjectId) {
        const { data: subjRow, error: subjErr } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('id', input.subjectId)
          .single();
        if (subjErr) {
          console.error('Failed to load subject by id', subjErr);
          throw new Error(`Failed to resolve subject: ${subjErr.message}`);
        }
        resolvedSubjectId = subjRow.id;
        resolvedSubject = mapSubjectNameToEnum(subjRow.name);
      } else {
        console.warn('No subjectId provided, falling back to provided subject enum');
        if (!resolvedSubject) resolvedSubject = 'others';
      }
    }

    const finalMcqQuestions = input.mcqQuestions || 0;
    const finalTextQuestions = input.textQuestions || 0;
    const calculatedTotal = finalMcqQuestions + finalTextQuestions;

    let finalTotalQuestions = input.totalQuestions;
    let adjustedMcqQuestions = finalMcqQuestions;
    let adjustedTextQuestions = finalTextQuestions;

    if (calculatedTotal !== input.totalQuestions) {
      console.log(`Adjusting question counts: MCQ(${finalMcqQuestions}) + Text(${finalTextQuestions}) = ${calculatedTotal} != Total(${input.totalQuestions})`);
      adjustedMcqQuestions = Math.max(0, input.totalQuestions - finalTextQuestions);
      adjustedTextQuestions = finalTextQuestions;
      finalTotalQuestions = adjustedMcqQuestions + adjustedTextQuestions;
    }

    const insertPayload: Record<string, any> = {
      user_id: input.userId,
      subject: resolvedSubject,
      sheet_name: input.sheetName,
      test_type: input.testType,
      total_questions: finalTotalQuestions,
      mcq_questions: adjustedMcqQuestions,
      text_questions: adjustedTextQuestions,
      status: 'draft',
    };
    if (resolvedSubjectId) insertPayload.subject_id = resolvedSubjectId;

    const { data, error } = await supabase
      .from('answer_sheets')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Error creating answer sheet:', error);
      throw new Error(`Failed to create answer sheet: ${error.message}`);
    }

    console.log('✅ Answer sheet created:', {
      id: data.id,
      total_questions: data.total_questions,
      mcq_questions: data.mcq_questions,
      text_questions: data.text_questions,
      subject: data.subject,
      subject_id: data.subject_id,
    });
    return data;
  });

export default createAnswerSheetProcedure;