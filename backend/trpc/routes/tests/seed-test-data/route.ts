import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const seedTestData = publicProcedure
  .input(z.object({ 
    userId: z.string()
  }))
  .mutation(async ({ input }) => {
    console.log('Seeding test data for user:', input.userId);
    
    // First, create some test subjects if they don't exist
    const subjects = ['국어', '수학', '영어', '탐구', '한국사'];
    
    for (const subject of subjects) {
      const { data: existingSubject } = await supabase
        .from('subjects')
        .select('id')
        .eq('user_id', input.userId)
        .eq('name', subject)
        .single();
      
      if (!existingSubject) {
        const { error } = await supabase
          .from('subjects')
          .insert({
            user_id: input.userId,
            name: subject
          });
        
        if (error) {
          console.error('Error creating subject:', subject, error);
        } else {
          console.log('Created subject:', subject);
        }
      }
    }

    // Create sample tests with results
    const testData = [
      {
        subject: '국어',
        test_type: 'mock',
        test_name: 'Mock Test 1',
        test_date: '2025-01-15',
        result: {
          raw_score: 85,
          standard_score: 131,
          percentile: 93,
          grade: 2,
          analysis_data: JSON.stringify({
            korean: { rawScore: 85, standardScore: 131, percentile: 93, grade: 2 },
            math: { rawScore: 78, standardScore: 125, percentile: 87, grade: 3 }
          })
        }
      },
      {
        subject: '국어',
        test_type: 'mock',
        test_name: 'Mock Test 2',
        test_date: '2025-01-09',
        result: {
          raw_score: 92,
          standard_score: 137,
          percentile: 95,
          grade: 2,
          analysis_data: JSON.stringify({
            korean: { rawScore: 92, standardScore: 137, percentile: 95, grade: 2 },
            math: { rawScore: 88, standardScore: 135, percentile: 94, grade: 2 }
          })
        }
      },
      {
        subject: '수학',
        test_type: 'mock',
        test_name: 'Mock Test 1',
        test_date: '2025-01-12',
        result: {
          raw_score: 76,
          standard_score: 123,
          percentile: 84,
          grade: 3,
          analysis_data: JSON.stringify({
            math: { rawScore: 76, standardScore: 123, percentile: 84, grade: 3 },
            korean: { rawScore: 82, standardScore: 128, percentile: 89, grade: 2 }
          })
        }
      },
      {
        subject: '영어',
        test_type: 'midterm',
        test_name: 'Mid Term Test 1',
        test_date: '2025-01-20',
        result: {
          raw_score: 88,
          standard_score: 134,
          percentile: 91,
          grade: 2,
          analysis_data: JSON.stringify({
            english: { rawScore: 88, standardScore: 134, percentile: 91, grade: 2 }
          })
        }
      }
    ];

    const createdTests = [];
    
    for (const testInfo of testData) {
      // Check if test already exists
      const { data: existingTest } = await supabase
        .from('tests')
        .select('id')
        .eq('user_id', input.userId)
        .eq('subject', testInfo.subject)
        .eq('test_name', testInfo.test_name)
        .single();
      
      if (!existingTest) {
        // Create test
        const { data: test, error: testError } = await supabase
          .from('tests')
          .insert({
            user_id: input.userId,
            subject: testInfo.subject,
            test_type: testInfo.test_type,
            test_name: testInfo.test_name,
            test_date: testInfo.test_date
          })
          .select()
          .single();
        
        if (testError) {
          console.error('Error creating test:', testError);
          continue;
        }
        
        // Create test result
        const { error: resultError } = await supabase
          .from('test_results')
          .insert({
            test_id: test.id,
            user_id: input.userId,
            raw_score: testInfo.result.raw_score,
            standard_score: testInfo.result.standard_score,
            percentile: testInfo.result.percentile,
            grade: testInfo.result.grade,
            analysis_data: testInfo.result.analysis_data
          });
        
        if (resultError) {
          console.error('Error creating test result:', resultError);
        }
        
        createdTests.push(test);
      }
    }

    return { 
      message: 'Test data seeded successfully',
      testsCreated: createdTests.length
    };
  });

// Debug procedure to check database state
export const debugTestData = publicProcedure
  .input(z.object({ 
    userId: z.string()
  }))
  .query(async ({ input }) => {
    console.log('Debugging test data for user:', input.userId);
    
    // Check tests
    const { data: tests, error: testsError } = await supabase
      .from('tests')
      .select('*')
      .eq('user_id', input.userId);
    
    if (testsError) {
      console.error('Error fetching tests:', testsError);
    } else {
      console.log('Found tests:', tests?.length || 0);
    }
    
    // Check test results
    const { data: results, error: resultsError } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', input.userId);
    
    if (resultsError) {
      console.error('Error fetching test results:', resultsError);
    } else {
      console.log('Found test results:', results?.length || 0);
    }
    
    // Check subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', input.userId);
    
    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError);
    } else {
      console.log('Found subjects:', subjects?.length || 0);
    }
    
    return {
      tests: tests || [],
      testResults: results || [],
      subjects: subjects || [],
      testsCount: tests?.length || 0,
      resultsCount: results?.length || 0,
      subjectsCount: subjects?.length || 0
    };
  });

export default seedTestData;