import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const seedExamData = publicProcedure
  .input(z.object({ userId: z.string() }))
  .mutation(async ({ input }) => {
    // Check if user already has exams
    const { data: existingExams } = await supabase
      .from('exams')
      .select('id')
      .eq('user_id', input.userId)
      .limit(1);

    if (existingExams && existingExams.length > 0) {
      return { message: 'User already has exams' };
    }

    // Sample exam data for test user
    const sampleExams = [
      {
        user_id: input.userId,
        title: 'Math Final Exam',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        subject: 'Mathematics',
        priority: true,
      },
      {
        user_id: input.userId,
        title: 'Physics Midterm',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subject: 'Physics',
        priority: false,
      },
      {
        user_id: input.userId,
        title: 'Chemistry Quiz',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        subject: 'Chemistry',
        priority: true,
      },
      {
        user_id: input.userId,
        title: 'English Essay',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        subject: 'English',
        priority: false,
      },
    ];

    const { data, error } = await supabase
      .from('exams')
      .insert(sampleExams)
      .select();

    if (error) {
      throw new Error(`Failed to seed exam data: ${error.message}`);
    }

    return { message: 'Exam data seeded successfully', data };
  });

export default seedExamData;