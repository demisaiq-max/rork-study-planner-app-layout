import { Redirect, Stack } from 'expo-router';
import { useIsSignedIn } from '@/hooks/auth-context';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoading } = useIsSignedIn();

  useEffect(() => {
    console.log('🔐 Auth Layout - Status:', {
      isLoading,
      isSignedIn,
      timestamp: new Date().toISOString()
    });
  }, [isLoading, isSignedIn]);

  // Show loading screen while checking authentication status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  // If user is signed in, redirect to main app
  if (isSignedIn) {
    console.log('🔐 User is authenticated, redirecting to main app');
    return <Redirect href="/(tabs)" />;
  }

  // User is not signed in, show auth screens
  console.log('🔐 User not authenticated, showing auth screens');
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="landing" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="confirm-email" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});