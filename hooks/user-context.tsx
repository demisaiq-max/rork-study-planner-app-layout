import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
}

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        // Create a default user for demo purposes
        const defaultUser: User = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User',
          profilePictureUrl: undefined
        };
        setUser(defaultUser);
        await AsyncStorage.setItem('user', JSON.stringify(defaultUser));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

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