import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import * as WebBrowser from 'expo-web-browser';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startGitHubOAuth } = useOAuth({ strategy: 'oauth_github' });
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [emailAddress, setEmailAddress] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        console.error('Sign in incomplete:', JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      console.error('Sign in error:', JSON.stringify(err, null, 2));
      console.error('Sign in failed:', err?.errors?.[0]?.message || 'Failed to sign in');
    }
  };

  const onGoogleSignIn = React.useCallback(async () => {
    try {
      console.log('🔐 Starting Google OAuth...');
      
      // Warm up the browser for better performance (only on native)
      if (Platform.OS !== 'web') {
        await WebBrowser.warmUpAsync();
      }
      
      const { createdSessionId, setActive, signIn, signUp } = await startGoogleOAuth();

      console.log('🔐 Google OAuth result:', { 
        createdSessionId: !!createdSessionId,
        signIn: !!signIn,
        signUp: !!signUp
      });
      
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        console.log('🔐 Session set, redirecting to home...');
        router.replace('/(tabs)');
      } else {
        console.log('🔐 No session created, checking sign in/up status');
        if (signIn?.createdSessionId) {
          await setActive!({ session: signIn.createdSessionId });
          router.replace('/(tabs)');
        } else if (signUp?.createdSessionId) {
          await setActive!({ session: signUp.createdSessionId });
          router.replace('/(tabs)');
        }
      }
      
      // Cool down the browser (only on native)
      if (Platform.OS !== 'web') {
        try {
          await WebBrowser.coolDownAsync();
        } catch (error) {
          console.log('WebBrowser coolDown not available:', error);
        }
      }
    } catch (err: any) {
      console.error('Google OAuth error:', JSON.stringify(err, null, 2));
      if (Platform.OS !== 'web') {
        try {
          await WebBrowser.coolDownAsync();
        } catch (error) {
          console.log('WebBrowser coolDown not available:', error);
        }
      }
    }
  }, [startGoogleOAuth, router]);

  const onGitHubSignIn = React.useCallback(async () => {
    try {
      console.log('🔐 Starting GitHub OAuth...');
      
      // Warm up the browser for better performance (only on native)
      if (Platform.OS !== 'web') {
        await WebBrowser.warmUpAsync();
      }
      
      const { createdSessionId, setActive, signIn, signUp } = await startGitHubOAuth();

      console.log('🔐 GitHub OAuth result:', { 
        createdSessionId: !!createdSessionId,
        signIn: !!signIn,
        signUp: !!signUp
      });
      
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        console.log('🔐 Session set, redirecting to home...');
        router.replace('/(tabs)');
      } else {
        console.log('🔐 No session created, checking sign in/up status');
        if (signIn?.createdSessionId) {
          await setActive!({ session: signIn.createdSessionId });
          router.replace('/(tabs)');
        } else if (signUp?.createdSessionId) {
          await setActive!({ session: signUp.createdSessionId });
        }
      }
      
      // Cool down the browser (only on native)
      if (Platform.OS !== 'web') {
        try {
          await WebBrowser.coolDownAsync();
        } catch (error) {
          console.log('WebBrowser coolDown not available:', error);
        }
      }
    } catch (err: any) {
      console.error('GitHub OAuth error:', JSON.stringify(err, null, 2));
      if (Platform.OS !== 'web') {
        try {
          await WebBrowser.coolDownAsync();
        } catch (error) {
          console.log('WebBrowser coolDown not available:', error);
        }
      }
    }
  }, [startGitHubOAuth, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your studies</Text>
        
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={setEmailAddress}
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          value={password}
          placeholder="Enter password"
          secureTextEntry={true}
          onChangeText={setPassword}
          autoComplete="current-password"
        />
        <TouchableOpacity style={styles.button} onPress={onSignInPress}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <TouchableOpacity style={styles.oauthButton} onPress={onGoogleSignIn}>
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text style={styles.oauthButtonText}>Continue with Google</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.oauthButton} onPress={onGitHubSignIn}>
          <Ionicons name="logo-github" size={20} color="#333" />
          <Text style={styles.oauthButtonText}>Continue with GitHub</Text>
        </TouchableOpacity>
        
        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  linkText: {
    fontSize: 16,
    color: '#666',
  },
  link: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e1e5e9',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
  },
  oauthButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  oauthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
  },
});