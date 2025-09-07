import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const seedTestDataProcedure = publicProcedure
  .input(z.object({ 
    userId: z.string()
  }))
  .mutation(async ({ input }) => {
    try {
      // First, insert test subjects if they don't exist
      const subjects = ['국어', '영어', '수학', '탐구'];
      
      for (const subject of subjects) {
        await supabase
          .from('tests')
          .upsert([
            {
              user_id: input.userId,
              subject: subject,
              test_type: 'mock',
              test_name: 'Mock Test 1',
              test_date: '2025-08-25'
            },
            {
              user_id: input.userId,
              subject: subject,
              test_type: 'mock', 
              test_name: 'Mock Test 2',
              test_date: '2025-09-01'
            },
            {
              user_id: input.userId,
              subject: subject,
              test_type: 'midterm',
              test_name: 'Mid Term Test 1',
              test_date: '2025-09-15'
            },
            {
              user_id: input.userId,
              subject: subject,
              test_type: 'final',
              test_name: 'Final Test 1',
              test_date: '2025-10-20'
            }
          ], {
            onConflict: 'user_id,subject,test_type,test_name',
            ignoreDuplicates: true
          });
      }

      // Get all tests for this user to create results
      const { data: tests, error: testsError } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', input.userId);

      if (testsError) {
        throw new Error(`Failed to fetch tests: ${testsError.message}`);
      }

      // Create sample test results with realistic Korean test data
      const testResults = [];
      
      for (const test of tests || []) {
        // Generate realistic scores based on subject and test type
        let rawScore, standardScore, percentile, grade, analysisData;
        
        if (test.subject === '국어') {
          rawScore = test.test_name.includes('Mock Test 1') ? 80 : test.test_name.includes('Mock Test 2') ? 86 : 88;
          standardScore = test.test_name.includes('Mock Test 1') ? 131 : test.test_name.includes('Mock Test 2') ? 137 : 139;
          percentile = test.test_name.includes('Mock Test 1') ? 93 : test.test_name.includes('Mock Test 2') ? 95 : 96;
          grade = 2;
          analysisData = JSON.stringify({
            korean: { rawScore, standardScore, percentile, grade },
            math: { rawScore: 86, standardScore: 137, percentile: 95, grade: 2 },
            english: { rawScore: 75, standardScore: 125, percentile: 89, grade: 3 }
          });
        } else if (test.subject === '수학') {
          rawScore = test.test_name.includes('Mock Test 1') ? 92 : test.test_name.includes('Mock Test 2') ? 88 : 90;
          standardScore = test.test_name.includes('Mock Test 1') ? 145 : test.test_name.includes('Mock Test 2') ? 141 : 143;
          percentile = test.test_name.includes('Mock Test 1') ? 96 : test.test_name.includes('Mock Test 2') ? 94 : 95;
          grade = test.test_name.includes('Mock Test 1') ? 1 : 2;
          analysisData = JSON.stringify({
            korean: { rawScore: 80, standardScore: 131, percentile: 93, grade: 2 },
            math: { rawScore, standardScore, percentile, grade },
            english: { rawScore: 75, standardScore: 125, percentile: 89, grade: 3 }
          });
        } else if (test.subject === '영어') {
          rawScore = test.test_name.includes('Mock Test 1') ? 75 : test.test_name.includes('Mock Test 2') ? 82 : 78;
          standardScore = test.test_name.includes('Mock Test 1') ? 125 : test.test_name.includes('Mock Test 2') ? 132 : 128;
          percentile = test.test_name.includes('Mock Test 1') ? 89 : test.test_name.includes('Mock Test 2') ? 92 : 90;
          grade = test.test_name.includes('Mock Test 2') ? 2 : 3;
          analysisData = JSON.stringify({
            korean: { rawScore: 80, standardScore: 131, percentile: 93, grade: 2 },
            math: { rawScore: 86, standardScore: 137, percentile: 95, grade: 2 },
            english: { rawScore, standardScore, percentile, grade }
          });
        } else { // 탐구
          rawScore = test.test_name.includes('Mock Test 1') ? 85 : test.test_name.includes('Mock Test 2') ? 89 : 87;
          standardScore = test.test_name.includes('Mock Test 1') ? 135 : test.test_name.includes('Mock Test 2') ? 140 : 138;
          percentile = test.test_name.includes('Mock Test 1') ? 91 : test.test_name.includes('Mock Test 2') ? 94 : 92;
          grade = 2;
          analysisData = JSON.stringify({
            korean: { rawScore: 80, standardScore: 131, percentile: 93, grade: 2 },
            math: { rawScore: 86, standardScore: 137, percentile: 95, grade: 2 },
            science: { rawScore, standardScore, percentile, grade }
          });
        }

        testResults.push({
          test_id: test.id,
          user_id: input.userId,
          raw_score: rawScore,
          standard_score: standardScore,
          percentile: percentile,
          grade: grade,
          analysis_data: analysisData
        });
      }

      // Insert test results
      if (testResults.length > 0) {
        const { error: resultsError } = await supabase
          .from('test_results')
          .upsert(testResults, {
            onConflict: 'test_id,user_id',
            ignoreDuplicates: false
          });

        if (resultsError) {
          throw new Error(`Failed to seed test results: ${resultsError.message}`);
        }
      }

      return { success: true, message: 'Test data seeded successfully', testsCreated: tests?.length || 0, resultsCreated: testResults.length };
    } catch (error: any) {
      console.error('Seed test data error:', error);
      throw new Error(`Failed to seed test data: ${error.message}`);
    }
  });

export default seedTestDataProcedure;