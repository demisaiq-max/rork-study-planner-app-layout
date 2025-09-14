// BACKEND DISABLED - Using mock data instead of network requests
import React from 'react';

console.log('🚫 Backend disabled - using mock data');

// Mock tRPC client that returns mock data instead of making network requests
const createMockTrpcClient = () => {
  const mockData = {
    exams: {
      getUserExams: () => Promise.resolve([]),
      getPriorityExams: () => Promise.resolve([]),
      createExam: () => Promise.resolve({ id: 'mock-exam-id', title: 'Mock Exam' }),
      updateExam: () => Promise.resolve({ success: true }),
      deleteExam: () => Promise.resolve({ success: true }),
    },
    tests: {
      supabaseTest: () => Promise.resolve({ status: 'mock', message: 'Backend disabled' }),
      getLatestTestResults: () => Promise.resolve([]),
      getSubjectTests: () => Promise.resolve([]),
      getUserSubjects: () => Promise.resolve([]),
      getTestById: () => Promise.resolve(null),
      createTest: () => Promise.resolve({ id: 'mock-test-id' }),
      submitTestResult: () => Promise.resolve({ success: true }),
      createSubject: () => Promise.resolve({ id: 'mock-subject-id' }),
      updateSubject: () => Promise.resolve({ success: true }),
      deleteSubject: () => Promise.resolve({ success: true }),
    },
    community: {
      posts: {
        getPosts: () => Promise.resolve([]),
        createPost: () => Promise.resolve({ id: 'mock-post-id' }),
        likePost: () => Promise.resolve({ success: true }),
        addComment: () => Promise.resolve({ id: 'mock-comment-id' }),
        incrementView: () => Promise.resolve({ success: true }),
      },
      groups: {
        getGroups: () => Promise.resolve([]),
        joinGroup: () => Promise.resolve({ success: true }),
        leaveGroup: () => Promise.resolve({ success: true }),
      },
      questions: {
        getQuestions: () => Promise.resolve([]),
        createQuestion: () => Promise.resolve({ id: 'mock-question-id' }),
        addAnswer: () => Promise.resolve({ id: 'mock-answer-id' }),
        likeQuestion: () => Promise.resolve({ success: true }),
        incrementView: () => Promise.resolve({ success: true }),
      },
    },
    grades: {
      getSubjectGrades: () => Promise.resolve([]),
      updateSubjectGrade: () => Promise.resolve({ success: true }),
      deleteSubjectGrade: () => Promise.resolve({ success: true }),
    },
    settings: {
      getUserSettings: () => Promise.resolve({ theme: 'light', notifications: true }),
      updateUserSettings: () => Promise.resolve({ success: true }),
    },
    study: {
      getStudySessions: () => Promise.resolve([]),
      createStudySession: () => Promise.resolve({ id: 'mock-session-id' }),
    },
    brainDumps: {
      getBrainDumps: () => Promise.resolve([]),
      createBrainDump: () => Promise.resolve({ id: 'mock-brain-dump-id' }),
      updateBrainDump: () => Promise.resolve({ success: true }),
      deleteBrainDump: () => Promise.resolve({ success: true }),
    },
    priorityTasks: {
      getPriorityTasks: () => Promise.resolve([]),
      createPriorityTask: () => Promise.resolve({ id: 'mock-task-id' }),
      updatePriorityTask: () => Promise.resolve({ success: true }),
      deletePriorityTask: () => Promise.resolve({ success: true }),
    },
    timers: {
      getTimerSessions: () => Promise.resolve([]),
      createTimerSession: () => Promise.resolve({ id: 'mock-timer-id' }),
      updateTimerSession: () => Promise.resolve({ success: true }),
      getActiveTimer: () => Promise.resolve(null),
      createPauseLog: () => Promise.resolve({ id: 'mock-pause-id' }),
    },
  };

  // Create a proxy that intercepts all property access and returns mock query objects
  const createMockQuery = (data: any) => ({
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: () => Promise.resolve({ data }),
    isSuccess: true,
    status: 'success' as const,
  });

  const createMockMutation = (mockFn: Function) => ({
    mutate: mockFn,
    mutateAsync: mockFn,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: true,
    status: 'idle' as const,
  });

  const createMockProcedure = (mockFn: Function) => ({
    useQuery: (input?: any, options?: any) => {
      console.log('🎭 Mock query called with:', input);
      
      // Use React hooks properly
      const [data, setData] = React.useState<any>(null);
      const [isLoading, setIsLoading] = React.useState<boolean>(false);
      const [isError, setIsError] = React.useState<boolean>(false);
      const [error, setError] = React.useState<any>(null);
      
      // Use useEffect to prevent state updates during render
      React.useEffect(() => {
        if (options?.enabled === false) {
          return;
        }
        
        setIsLoading(true);
        setIsError(false);
        setError(null);
        
        // Use setTimeout to simulate async behavior and prevent render-time state updates
        const timer = setTimeout(async () => {
          try {
            const result = await mockFn();
            setData(result);
            setIsLoading(false);
          } catch (err) {
            setError(err);
            setIsError(true);
            setIsLoading(false);
          }
        }, 1);
        
        return () => clearTimeout(timer);
      }, [input, options?.enabled]);
      
      const refetch = React.useCallback(async () => {
        setIsLoading(true);
        try {
          const result = await mockFn();
          setData(result);
          setIsLoading(false);
          return { data: result };
        } catch (err) {
          setError(err);
          setIsError(true);
          setIsLoading(false);
          throw err;
        }
      }, []);
      
      return {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isSuccess: !isLoading && !isError && data !== null,
        status: isLoading ? 'loading' as const : isError ? 'error' as const : 'success' as const,
      };
    },
    useMutation: (options?: any) => {
      console.log('🎭 Mock mutation created');
      const [isLoading, setIsLoading] = React.useState<boolean>(false);
      const [isError, setIsError] = React.useState<boolean>(false);
      const [error, setError] = React.useState<any>(null);
      const [isSuccess, setIsSuccess] = React.useState<boolean>(false);
      
      const mutate = React.useCallback(async (variables?: any) => {
        setIsLoading(true);
        setIsError(false);
        setError(null);
        setIsSuccess(false);
        
        try {
          const result = await mockFn(variables);
          setIsSuccess(true);
          if (options?.onSuccess) {
            // Use setTimeout to prevent state updates during render
            setTimeout(() => options.onSuccess(result), 0);
          }
          return result;
        } catch (err) {
          setIsError(true);
          setError(err);
          if (options?.onError) {
            setTimeout(() => options.onError(err), 0);
          }
          throw err;
        } finally {
          setIsLoading(false);
        }
      }, [options]);
      
      return {
        mutate,
        mutateAsync: mutate,
        isLoading,
        isError,
        error,
        isSuccess,
        status: isLoading ? 'loading' as const : 'idle' as const,
        isPending: isLoading,
      };
    },
    query: mockFn,
    mutate: mockFn,
  });

  const createMockRouter = (routes: any): any => {
    const router: any = {};
    
    for (const [key, value] of Object.entries(routes)) {
      if (typeof value === 'function') {
        router[key] = createMockProcedure(value);
      } else if (typeof value === 'object' && value !== null) {
        router[key] = createMockRouter(value);
      }
    }
    
    return router;
  };

  return createMockRouter(mockData);
};

export const trpcClient = createMockTrpcClient();

// Mock trpc react client
export const trpc = {
  ...trpcClient,
  createClient: () => trpcClient,
  Provider: ({ children, client, queryClient }: any) => children,
  useContext: () => ({
    invalidate: () => Promise.resolve(),
    refetch: () => Promise.resolve(),
  }),
};

// Utility function to format errors (simplified for mock mode)
export const formatTRPCError = (error: any): string => {
  if (!error) return 'Unknown error';
  
  // Since backend is disabled, most errors should not occur
  // But we keep this for any remaining client-side errors
  if (error.message) {
    return error.message;
  }
  
  return 'An error occurred';
};

console.log('🎭 Mock tRPC Client initialized - Backend disabled');
console.log('📋 All API calls will return mock data');