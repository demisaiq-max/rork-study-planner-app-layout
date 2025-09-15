import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './auth-context';

export interface User {
  id: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
}

export const [UserProvider, useUser] = createContextHook(() => {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (authUser) {
        // Convert Supabase user to our User interface
        const userData: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          profilePictureUrl: authUser.user_metadata?.avatar_url
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [authUser, authLoading]);

  const updateUser = useCallback(async (userData: User) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    updateUser,
    logout,
  }), [user, isLoading, updateUser, logout]);
});