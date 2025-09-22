import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
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