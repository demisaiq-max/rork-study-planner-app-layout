import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './auth-context';
import { trpc } from '@/lib/trpc';

export interface User {
  id: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
  role?: string;
}

export const [UserProvider, useUser] = createContextHook(() => {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userProfileQuery = trpc.users.getUserProfile.useQuery(
    { userId: authUser?.id || '' },
    { 
      enabled: !!authUser?.id,
      retry: false,
    }
  );

  useEffect(() => {
    if (!authLoading) {
      if (authUser && userProfileQuery.data) {
        // Use data from backend which includes role
        const userData: User = {
          id: userProfileQuery.data.id,
          email: userProfileQuery.data.email,
          name: userProfileQuery.data.name,
          profilePictureUrl: userProfileQuery.data.profilePictureUrl || undefined,
          role: userProfileQuery.data.role || 'student',
        };
        setUser(userData);
        setIsLoading(false);
      } else if (authUser && !userProfileQuery.data && !userProfileQuery.isLoading) {
        // Fallback to auth user data if profile query fails
        const userData: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          profilePictureUrl: authUser.user_metadata?.avatar_url,
          role: 'student', // Default role
        };
        setUser(userData);
        setIsLoading(false);
      } else if (!authUser) {
        setUser(null);
        setIsLoading(false);
      }
    }
  }, [authUser, authLoading, userProfileQuery.data, userProfileQuery.isLoading]);

  const updateUser = useCallback(async (userData: User) => {
    try {
      setUser(userData);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  return useMemo(() => ({
    user,
    isLoading: isLoading || userProfileQuery.isLoading,
    updateUser,
    logout,
  }), [user, isLoading, userProfileQuery.isLoading, updateUser, logout]);
});