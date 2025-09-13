import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const updateSubjectGrade = publicProcedure
  .input(z.object({
    userId: z.string(),
    subject: z.string(),
    examType: z.enum(['mock', 'midterm', 'final']),
    grade: z.number().min(1).max(9).nullable(),
  }))
  .mutation(async ({ input }) => {
    // First, get existing grade data
    const { data: existing } = await supabase
      .from('subject_grades')
      .select('*')
      .eq('user_id', input.userId)
      .eq('subject', input.subject)
      .single();

    // Parse existing grades or create new object
    const grades = existing?.grades ? JSON.parse(existing.grades) : {};
    
    // Update the specific exam type grade
    if (input.grade === null) {
      delete grades[input.examType];
    } else {
      grades[input.examType] = input.grade;
    }

    // Upsert the grade data
    const { data, error } = await supabase
      .from('subject_grades')
      .upsert({
        user_id: input.userId,
        subject: input.subject,
        grade: existing?.grade || '미정', // Keep legacy grade field
        grades: JSON.stringify(grades), // Store all grades as JSON
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update subject grade: ${error.message}`);
    }

    return data;
  });

export default updateSubjectGrade;