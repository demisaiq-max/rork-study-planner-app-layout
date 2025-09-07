import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const seedDummyDataProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { userId } = input;

    // Dummy data for different subjects and test types
    const dummyGrades = [
      {
        user_id: userId,
        subject: 'Korean',
        grades: JSON.stringify({
          mock: 3,
          midterm: 2,
          final: 2
        })
      },
      {
        user_id: userId,
        subject: 'English',
        grades: JSON.stringify({
          mock: 2,
          midterm: 2,
          final: 1
        })
      },
      {
        user_id: userId,
        subject: 'Math',
        grades: JSON.stringify({
          mock: 4,
          midterm: 3,
          final: 3
        })
      },
      {
        user_id: userId,
        subject: 'Science',
        grades: JSON.stringify({
          mock: 2,
          midterm: 2,
          final: null
        })
      }
    ];

    // First, check if user already has grades
    const { data: existingGrades } = await supabase
      .from('subject_grades')
      .select('*')
      .eq('user_id', userId);

    if (!existingGrades || existingGrades.length === 0) {
      // Insert dummy data
      const { error } = await supabase
        .from('subject_grades')
        .insert(dummyGrades);

      if (error) {
        throw new Error(`Failed to seed dummy data: ${error.message}`);
      }
    }

    return { success: true, message: 'Dummy data seeded successfully' };
  });