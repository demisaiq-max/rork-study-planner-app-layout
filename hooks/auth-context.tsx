import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔐 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
        } else {
          console.log('✅ Initial session:', session ? 'Found' : 'None');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sessionData) => {
        console.log('🔐 Auth state changed:', event || 'unknown', sessionData ? 'Session exists' : 'No session');
        
        setSession(sessionData);
        setUser(sessionData?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || !password?.trim()) {
      return { error: 'Email and password are required' };
    }

    try {
      console.log('🔐 Signing in with email:', email.trim());
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        return { error: error.message };
      }

      console.log('✅ Sign in successful');
      return {};
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { error: 'An unexpected error occurred' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    if (!email?.trim() || !password?.trim()) {
      return { error: 'Email and password are required' };
    }

    try {
      console.log('🔐 Signing up with email:', email.trim());
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name?.trim() || email.split('@')[0],
          },
        },
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        return { error: error.message };
      }

      console.log('✅ Sign up successful');
      return {};
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      return { error: 'An unexpected error occurred' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('🔐 Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
      } else {
        console.log('✅ Sign out successful');
      }
    } catch (error) {
      console.error('❌ Sign out exception:', error);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      console.log('🔐 Signing in with Google...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'exp://localhost:8081',
        },
      });

      if (error) {
        console.error('❌ Google sign in error:', error);
        return { error: error.message };
      }

      console.log('✅ Google sign in initiated');
      return {};
    } catch (error) {
      console.error('❌ Google sign in exception:', error);
      return { error: 'An unexpected error occurred' };
    }
  }, []);

  return useMemo(() => ({
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  }), [user, session, isLoading, signIn, signUp, signOut, signInWithGoogle]);
});

// Helper hook to check if user is signed in
export function useIsSignedIn() {
  const { user, isLoading } = useAuth();
  return { isSignedIn: !!user, isLoading };
}