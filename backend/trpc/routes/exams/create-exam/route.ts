import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const createExam = publicProcedure
  .input(z.object({
    userId: z.string(),
    title: z.string(),
    date: z.string(),
    subject: z.string(),
    priority: z.boolean().optional().default(false),
  }))
  .mutation(async ({ input }) => {
    // Use the test user UUID from the database if 'test-user' is passed
    const userId = input.userId === 'test-user' 
      ? '550e8400-e29b-41d4-a716-446655440000' 
      : input.userId;
    
    // First, check if the user exists in the database
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('Error checking user existence:', userCheckError);
      throw new Error('Failed to verify user');
    }

    if (!existingUser) {
      console.error('User not found in database:', userId);
      throw new Error('User not found. Please ensure you are properly signed in and synced.');
    }
    
    const { data, error } = await supabase
      .from('exams')
      .insert({
        user_id: userId,
        title: input.title,
        date: input.date,
        subject: input.subject,
        priority: input.priority,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating exam:', error);
      throw new Error(`Failed to create exam: ${error.message}`);
    }

    console.log('✅ Exam created successfully:', data);
    return data;
  });

export default createExam;