import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const updateSubject = publicProcedure
  .input(z.object({ 
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    color: z.string().optional(),
    mcqQuestions: z.number().optional(),
    textQuestions: z.number().optional(),
    totalQuestions: z.number().optional(),
    questionConfig: z.array(z.object({
      number: z.number(),
      type: z.enum(['mcq', 'text'])
    })).optional()
  }))
  .mutation(async ({ input }) => {
    // Check if new subject name already exists (excluding current subject)
    const { data: existingSubjects } = await supabase
      .from('subjects')
      .select('id')
      .eq('user_id', input.userId)
      .eq('name', input.name)
      .neq('id', input.id)
      .limit(1);

    if (existingSubjects && existingSubjects.length > 0) {
      throw new Error('Subject already exists');
    }

    // Update the subject
    const updateData: any = {
      name: input.name,
      updated_at: new Date().toISOString(),
    };

    if (input.color !== undefined) updateData.color = input.color;
    if (input.mcqQuestions !== undefined) updateData.mcq_questions = input.mcqQuestions;
    if (input.textQuestions !== undefined) updateData.text_questions = input.textQuestions;
    if (input.totalQuestions !== undefined) updateData.total_questions = input.totalQuestions;
    if (input.questionConfig !== undefined) {
      updateData.question_config = input.questionConfig ? JSON.stringify(input.questionConfig) : null;
    }

    const { data, error } = await supabase
      .from('subjects')
      .update(updateData)
      .eq('id', input.id)
      .eq('user_id', input.userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update subject: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      mcqQuestions: data.mcq_questions,
      textQuestions: data.text_questions,
      totalQuestions: data.total_questions,
      questionConfig: data.question_config ? JSON.parse(data.question_config) : null,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  });

export default updateSubject;