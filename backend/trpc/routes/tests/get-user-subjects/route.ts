import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

export const getUserSubjects = publicProcedure
  .input(z.object({ userId: z.string().optional().nullable() }))
  .query(async ({ input }) => {
    const userId = input?.userId ?? '';
    console.log('[getUserSubjects] fetching for user', userId || '(anonymous)', 'input:', input);

    const defaultSubjects = [
      { key: 'korean', name: '국어', color: '#FF6B6B', mcq: 34, text: 11 },
      { key: 'mathematics', name: '수학', color: '#4ECDC4', mcq: 30, text: 0 },
      { key: 'english', name: '영어', color: '#45B7D1', mcq: 45, text: 0 },
      { key: 'exploration', name: '탐구', color: '#96CEB4', mcq: 20, text: 0 },
      { key: 'history', name: '한국사', color: '#9B59B6', mcq: 20, text: 0 },
    ] as const;

    if (!userId) {
      console.warn('[getUserSubjects] No userId provided. Returning unified default subjects (virtual).');
      return defaultSubjects.map((s) => ({
        id: `public-${s.key}`,
        name: s.name,
        color: s.color,
        mcqQuestions: s.mcq,
        textQuestions: s.text,
        totalQuestions: s.mcq + s.text,
        questionConfig: null,
        createdAt: new Date().toISOString(),
      }));
    }
    
    // Force creation of default subjects for all users
    console.log('[getUserSubjects] Attempting to create default subjects for user:', userId);

    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch subjects: ${error.message}`);
    }

    // Always try to create default subjects if they don't exist
    console.log('[getUserSubjects] Checking if we need to create default subjects. Current count:', data?.length || 0);
    
    if (!data || data.length === 0) {
      console.log('[getUserSubjects] No subjects found, creating default subjects for user:', userId);
      
      // First, let's check if the subjects table has the required columns
      const { data: tableInfo, error: tableError } = await supabase
        .from('subjects')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('[getUserSubjects] Error checking subjects table:', tableError);
        // Return virtual subjects if table has issues
        return defaultSubjects.map((s) => ({
          id: `virtual-${s.key}`,
          name: s.name,
          color: s.color,
          mcqQuestions: s.mcq,
          textQuestions: s.text,
          totalQuestions: s.mcq + s.text,
          questionConfig: null,
          createdAt: new Date().toISOString(),
        }));
      }
      
      const insertPromises = defaultSubjects.map((subject) =>
        supabase
          .from('subjects')
          .insert({
            user_id: userId,
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
      console.log('[getUserSubjects] Insert results:', results.map(r => ({ error: r.error?.message, hasData: !!r.data })));
      
      // Check if any inserts failed due to missing columns
      const hasColumnErrors = results.some(r => r.error?.message?.includes('column') || r.error?.message?.includes('does not exist'));
      
      if (hasColumnErrors) {
        console.warn('[getUserSubjects] Database schema issues detected, returning virtual subjects');
        return defaultSubjects.map((s) => ({
          id: `virtual-${s.key}-${userId}`,
          name: s.name,
          color: s.color,
          mcqQuestions: s.mcq,
          textQuestions: s.text,
          totalQuestions: s.mcq + s.text,
          questionConfig: null,
          createdAt: new Date().toISOString(),
        }));
      }
      
      const createdSubjects = results
        .map((result) => {
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
            createdAt: result.data.created_at,
          };
        })
        .filter(Boolean);
      
      console.log('[getUserSubjects] Created subjects count:', createdSubjects.length);
      
      // If no subjects were created successfully, return virtual ones
      if (createdSubjects.length === 0) {
        console.warn('[getUserSubjects] No subjects created successfully, returning virtual subjects');
        return defaultSubjects.map((s) => ({
          id: `virtual-${s.key}-${userId}`,
          name: s.name,
          color: s.color,
          mcqQuestions: s.mcq,
          textQuestions: s.text,
          totalQuestions: s.mcq + s.text,
          questionConfig: null,
          createdAt: new Date().toISOString(),
        }));
      }

      return createdSubjects as {
        id: string;
        name: string;
        color: string;
        mcqQuestions: number;
        textQuestions: number;
        totalQuestions: number;
        questionConfig: any;
        createdAt: string;
      }[];
    }

    console.log('[getUserSubjects] Returning existing subjects count:', data.length);
    
    // Check if existing data has the required columns
    const hasRequiredColumns = data.length > 0 && 
      'color' in data[0] && 
      'mcq_questions' in data[0] && 
      'text_questions' in data[0] && 
      'total_questions' in data[0];
    
    if (!hasRequiredColumns) {
      console.warn('[getUserSubjects] Existing subjects missing required columns, returning virtual subjects');
      return defaultSubjects.map((s) => ({
        id: `virtual-${s.key}-${userId}`,
        name: s.name,
        color: s.color,
        mcqQuestions: s.mcq,
        textQuestions: s.text,
        totalQuestions: s.mcq + s.text,
        questionConfig: null,
        createdAt: new Date().toISOString(),
      }));
    }
    
    return data.map((subject) => ({
      id: subject.id,
      name: subject.name,
      color: subject.color || '#4ECDC4',
      mcqQuestions: subject.mcq_questions || 20,
      textQuestions: subject.text_questions || 0,
      totalQuestions: subject.total_questions || 20,
      questionConfig: subject.question_config ? JSON.parse(subject.question_config) : null,
      createdAt: subject.created_at,
    }));
  });

export default getUserSubjects;