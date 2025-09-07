import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const seedTestData = publicProcedure
  .input(z.object({ 
    userId: z.string()
  }))
  .mutation(async ({ input }) => {
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
        await supabase
          .from('subjects')
          .insert({
            user_id: input.userId,
            name: subject
          });
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

export default seedTestData;