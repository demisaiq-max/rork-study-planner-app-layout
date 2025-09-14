import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';

export const supabaseTestProcedure = publicProcedure
  .query(async () => {
    try {
      console.log('Testing Supabase connection...');
      
      // Test basic connection
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersError) {
        console.error('Supabase users error:', usersError);
        return {
          success: false,
          error: usersError.message,
          tables: {}
        };
      }
      
      // Test all main tables
      const tables = {
        users: users?.length || 0,
        tests: 0,
        test_results: 0,
        daily_posts: 0,
        study_groups: 0,
        questions: 0
      };
      
      // Test tests table
      const { data: tests, error: testsError } = await supabase
        .from('tests')
        .select('*')
        .limit(1);
      
      if (!testsError) {
        tables.tests = tests?.length || 0;
      }
      
      // Test test_results table
      const { data: testResults, error: testResultsError } = await supabase
        .from('test_results')
        .select('*')
        .limit(1);
      
      if (!testResultsError) {
        tables.test_results = testResults?.length || 0;
      }
      
      // Test community tables
      const { data: posts, error: postsError } = await supabase
        .from('daily_posts')
        .select('*')
        .limit(1);
      
      if (!postsError) {
        tables.daily_posts = posts?.length || 0;
      }
      
      const { data: groups, error: groupsError } = await supabase
        .from('study_groups')
        .select('*')
        .limit(1);
      
      if (!groupsError) {
        tables.study_groups = groups?.length || 0;
      }
      
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .limit(1);
      
      if (!questionsError) {
        tables.questions = questions?.length || 0;
      }
      
      console.log('Supabase test results:', { success: true, tables });
      
      return {
        success: true,
        tables,
        message: 'Supabase connection successful'
      };
    } catch (err) {
      console.error('Supabase test error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        tables: {}
      };
    }
  });