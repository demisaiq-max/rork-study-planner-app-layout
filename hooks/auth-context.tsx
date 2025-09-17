import { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        console.log('🔐 Getting initial session...');
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
        } else {
          console.log('✅ Initial session:', session ? 'Found' : 'None');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error);
        if (mounted) {
          // Set to null on timeout/error to prevent infinite loading
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sessionData) => {
        if (!mounted) return;
        
        console.log('🔐 Auth state changed:', event || 'unknown', sessionData ? 'Session exists' : 'No session');
        
        setSession(sessionData);
        setUser(sessionData?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
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
          emailRedirectTo: Platform.OS === 'web' 
            ? `${window.location.origin}/(auth)/confirm-email`
            : 'exp://localhost:8081/(auth)/confirm-email',
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
      
      // Always clear local state first
      setSession(null);
      setUser(null);
      
      // Try to sign out from Supabase, but don't fail if there's no session
      try {
        const { error } = await supabase.auth.signOut();
        
        if (error && error.message !== 'Auth session missing!') {
          console.error('❌ Sign out error:', error);
        } else {
          console.log('✅ Sign out successful');
        }
      } catch (sessionError: any) {
        // Handle AuthSessionMissingError gracefully
        if (sessionError.message?.includes('Auth session missing')) {
          console.log('ℹ️ No active session to sign out from');
        } else {
          console.error('❌ Sign out session error:', sessionError);
        }
      }
    } catch (error) {
      console.error('❌ Sign out exception:', error);
      // Ensure local state is cleared even on exception
      setSession(null);
      setUser(null);
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

  const resetPassword = useCallback(async (email: string) => {
    if (!email?.trim()) {
      return { error: 'Email is required' };
    }

    try {
      console.log('🔐 Sending password reset email to:', email.trim());
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: Platform.OS === 'web' 
          ? `${window.location.origin}/(auth)/reset-password`
          : 'exp://localhost:8081/(auth)/reset-password',
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return { error: error.message };
      }

      console.log('✅ Password reset email sent');
      return {};
    } catch (error) {
      console.error('❌ Password reset exception:', error);
      return { error: 'An unexpected error occurred' };
    }
  }, []);

  const confirmEmail = useCallback(async (token: string) => {
    if (!token?.trim()) {
      return { error: 'Confirmation token is required' };
    }

    try {
      console.log('📧 Confirming email with token');
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token.trim(),
        type: 'signup'
      });

      if (error) {
        console.error('❌ Email confirmation error:', error);
        return { error: error.message };
      }

      console.log('✅ Email confirmed successfully:', data);
      return { data };
    } catch (error) {
      console.error('❌ Email confirmation exception:', error);
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
    resetPassword,
    confirmEmail,
  }), [user, session, isLoading, signIn, signUp, signOut, signInWithGoogle, resetPassword, confirmEmail]);
});

// Helper hook to check if user is signed in
export function useIsSignedIn() {
  const { user, isLoading } = useAuth();
  return { isSignedIn: !!user, isLoading };
}