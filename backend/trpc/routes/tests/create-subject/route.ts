import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const createSubject = publicProcedure
  .input(z.object({ 
    userId: z.string(),
    name: z.string(),
    color: z.string().optional().default('#4ECDC4'),
    mcqQuestions: z.number().optional().default(20),
    textQuestions: z.number().optional().default(0),
    totalQuestions: z.number().optional().default(20),
    questionConfig: z.array(z.object({
      number: z.number(),
      type: z.enum(['mcq', 'text'])
    })).optional()
  }))
  .mutation(async ({ input }) => {
    // Check if subject already exists for this user
    const { data: existingSubjects } = await supabase
      .from('subjects')
      .select('id')
      .eq('user_id', input.userId)
      .eq('name', input.name)
      .limit(1);

    if (existingSubjects && existingSubjects.length > 0) {
      throw new Error('Subject already exists');
    }

    // Create the subject
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        user_id: input.userId,
        name: input.name,
        color: input.color,
        mcq_questions: input.mcqQuestions,
        text_questions: input.textQuestions,
        total_questions: input.totalQuestions,
        question_config: input.questionConfig ? JSON.stringify(input.questionConfig) : null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subject: ${error.message}`);
    }

    // Create default answer sheets for each test type
    const testTypes = ['mock', 'midterm', 'final'] as const;
    const subjectName = input.name.toLowerCase();
    
    // Determine subject type for answer sheet creation
    let answerSheetSubject: 'korean' | 'mathematics' | 'english' | 'others' = 'others';
    if (subjectName.includes('korean') || subjectName.includes('국어')) {
      answerSheetSubject = 'korean';
    } else if (subjectName.includes('mathematics') || subjectName.includes('수학') || subjectName.includes('math')) {
      answerSheetSubject = 'mathematics';
    } else if (subjectName.includes('english') || subjectName.includes('영어')) {
      answerSheetSubject = 'english';
    }

    // Create answer sheets for each test type
    for (const testType of testTypes) {
      const sheetName = `${input.name} ${testType.charAt(0).toUpperCase() + testType.slice(1)} Test`;
      
      const { error: sheetError } = await supabase
        .from('answer_sheets')
        .insert({
          user_id: input.userId,
          subject: answerSheetSubject,
          subject_id: data.id,
          sheet_name: sheetName,
          test_type: testType,
          total_questions: input.totalQuestions,
          mcq_questions: input.mcqQuestions,
          text_questions: input.textQuestions,
          status: 'draft'
        });

      if (sheetError) {
        console.error(`Error creating ${testType} answer sheet:`, sheetError);
        // Don't throw error here, just log it so subject creation doesn't fail
      }
    }

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      mcqQuestions: data.mcq_questions,
      textQuestions: data.text_questions,
      totalQuestions: data.total_questions,
      questionConfig: data.question_config ? JSON.parse(data.question_config) : null,
      createdAt: data.created_at
    };
  });

export default createSubject;