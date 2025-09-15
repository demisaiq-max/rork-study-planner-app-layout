import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bmxtcqpuhfrvnajozzlw.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJteHRjcXB1aGZydm5ham96emx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTQ4NDksImV4cCI6MjA3MjIzMDg0OX0.kDn1-ABfpKfUS7jBaUnSWuzNiUweiFp5dFzsOKNi0S0';

console.log('🔗 Supabase configuration:', {
  url: supabaseUrl,
  keyConfigured: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length || 0,
  urlValid: supabaseUrl.startsWith('https://'),
  keyValid: supabaseAnonKey.startsWith('eyJ')
});

// Validate configuration
if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
  console.error('❌ Invalid Supabase URL:', supabaseUrl);
}

if (!supabaseAnonKey || !supabaseAnonKey.startsWith('eyJ')) {
  console.error('❌ Invalid Supabase anon key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'expo-react-native'
    }
  }
});

// Test connection on initialization
const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Supabase connection test successful:', {
        hasData: !!data,
        recordCount: data?.length || 0
      });
    }
  } catch (err) {
    console.error('❌ Supabase connection test error:', {
      error: err instanceof Error ? err.message : String(err)
    });
  }
};

// Run test after a delay to ensure environment is ready
setTimeout(testSupabaseConnection, 3000);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      exams: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          date: string;
          subject: string;
          priority: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          date: string;
          subject: string;
          priority?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          date?: string;
          subject?: string;
          priority?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          duration: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          duration: number;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          duration?: number;
          date?: string;
          created_at?: string;
        };
      };
      subject_grades: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          grade: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          grade: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          grade?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          visible_subjects: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          visible_subjects: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          visible_subjects?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      tests: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          title?: string;
          created_at?: string;
        };
      };
      test_results: {
        Row: {
          id: string;
          user_id: string;
          test_id: string;
          score: number;
          total_questions: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_id: string;
          score: number;
          total_questions: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          test_id?: string;
          score?: number;
          total_questions?: number;
          created_at?: string;
        };
      };
      daily_posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          likes: number;
          views: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          likes?: number;
          views?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          likes?: number;
          views?: number;
          created_at?: string;
        };
      };
      study_groups: {
        Row: {
          id: string;
          name: string;
          description: string;
          member_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          member_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          member_count?: number;
          created_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          likes: number;
          views: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          likes?: number;
          views?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          likes?: number;
          views?: number;
          created_at?: string;
        };
      };
    };
  };
};