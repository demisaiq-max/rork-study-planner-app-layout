import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    console.log('🔐 Auth Layout - isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isSignedIn) {
    console.log('🔐 User is signed in, redirecting to home');
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
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