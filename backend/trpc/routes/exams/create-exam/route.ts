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
      throw new Error(`Failed to create exam: ${error.message}`);
    }

    return data;
  });

export default createExam;