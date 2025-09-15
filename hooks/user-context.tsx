import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser as useClerkUser, useAuth } from '@clerk/clerk-expo';

export interface User {
  id: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
}

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const { isSignedIn } = useAuth();

  const loadUser = useCallback(async () => {
    try {
      // If Clerk is loaded and user is signed in, use Clerk user data
      if (clerkLoaded && isSignedIn && clerkUser) {
        const clerkUserData: User = {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'User',
          profilePictureUrl: clerkUser.imageUrl || undefined
        };
        setUser(clerkUserData);
        await AsyncStorage.setItem('user', JSON.stringify(clerkUserData));
        console.log('✅ Using Clerk user data:', clerkUserData);
        return;
      }
      
      // If not signed in with Clerk, check for stored user data
      if (clerkLoaded && !isSignedIn) {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          // Only use stored data if it's not a Clerk user (fallback to test user)
          if (parsedUser.id === '550e8400-e29b-41d4-a716-446655440000') {
            setUser(parsedUser);
            console.log('✅ Using stored test user data:', parsedUser);
            return;
          }
        }
        
        // Create a default user for demo purposes when not signed in
        const defaultUser: User = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User',
          profilePictureUrl: undefined
        };
        setUser(defaultUser);
        await AsyncStorage.setItem('user', JSON.stringify(defaultUser));
        console.log('✅ Using default test user:', defaultUser);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser, clerkLoaded, isSignedIn]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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
      console.log('✅ User logged out');
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