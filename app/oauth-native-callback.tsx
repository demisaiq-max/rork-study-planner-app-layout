import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('🔐 OAuth callback - isLoading:', isLoading, 'isSignedIn:', !!user);
    
    if (!isLoading) {
      if (user) {
        console.log('🔐 OAuth successful, redirecting to home');
        router.replace('/(tabs)');
      } else {
        console.log('🔐 OAuth failed, redirecting to sign in');
        router.replace('/(auth)/sign-in');
      }
    }
  }, [isLoading, user, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});