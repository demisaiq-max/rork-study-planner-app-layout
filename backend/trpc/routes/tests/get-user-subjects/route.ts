import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const getUserSubjects = publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input }) => {
    // Get subjects from subjects table
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', input.userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch subjects: ${error.message}`);
    }

    // If no subjects found, create default subjects
    if (!data || data.length === 0) {
      const defaultSubjects = [
        { name: '국어', color: '#FF6B6B', mcq: 34, text: 11 },
        { name: '수학', color: '#4ECDC4', mcq: 30, text: 0 },
        { name: '영어', color: '#45B7D1', mcq: 45, text: 0 },
        { name: '탐구', color: '#96CEB4', mcq: 20, text: 0 },
        { name: '한국사', color: '#9B59B6', mcq: 20, text: 0 }
      ];

      const insertPromises = defaultSubjects.map(subject => 
        supabase
          .from('subjects')
          .insert({
            user_id: input.userId,
            name: subject.name,
            color: subject.color,
            mcq_questions: subject.mcq,
            text_questions: subject.text,
            total_questions: subject.mcq + subject.text,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()
      );

      const results = await Promise.all(insertPromises);
      const createdSubjects = results.map(result => {
        if (result.error) {
          console.error('Error creating default subject:', result.error);
          return null;
        }
        return {
          id: result.data.id,
          name: result.data.name,
          color: result.data.color,
          mcqQuestions: result.data.mcq_questions,
          textQuestions: result.data.text_questions,
          totalQuestions: result.data.total_questions,
          questionConfig: result.data.question_config ? JSON.parse(result.data.question_config) : null,
          createdAt: result.data.created_at
        };
      }).filter(Boolean);

      return createdSubjects;
    }

    // Transform the data to match the expected format
    return data.map(subject => ({
      id: subject.id,
      name: subject.name,
      color: subject.color,
      mcqQuestions: subject.mcq_questions,
      textQuestions: subject.text_questions,
      totalQuestions: subject.total_questions,
      questionConfig: subject.question_config ? JSON.parse(subject.question_config) : null,
      createdAt: subject.created_at
    }));
  });

export default getUserSubjects;