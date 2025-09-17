import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const seedExamData = publicProcedure
  .input(z.object({ userId: z.string() }))
  .mutation(async ({ input }) => {
    // Use the test user UUID from the database if 'test-user' is passed
    const userId = input.userId === 'test-user' 
      ? '550e8400-e29b-41d4-a716-446655440000' 
      : input.userId;
    
    // Check if user already has exams
    const { data: existingExams } = await supabase
      .from('exams')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingExams && existingExams.length > 0) {
      return { message: 'User already has exams' };
    }

    // Sample exam data for test user
    const sampleExams = [
      {
        user_id: userId,
        title: 'Math Final Exam',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        subject: 'Mathematics',
        priority: true,
      },
      {
        user_id: userId,
        title: 'Physics Midterm',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subject: 'Physics',
        priority: false,
      },
      {
        user_id: userId,
        title: 'Chemistry Quiz',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        subject: 'Chemistry',
        priority: true,
      },
      {
        user_id: userId,
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