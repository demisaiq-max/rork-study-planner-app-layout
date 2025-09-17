import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Mail } from 'lucide-react-native';

type ConfirmationState = 'loading' | 'success' | 'error' | 'already_confirmed';

export default function ConfirmEmailScreen() {
  const [state, setState] = useState<ConfirmationState>('loading');
  const [message, setMessage] = useState<string>('');
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        console.log('📧 Confirming email with params:', params);
        
        const token = params.token as string;
        const type = params.type as string;
        
        if (!token || type !== 'signup') {
          setState('error');
          setMessage('Invalid confirmation link');
          return;
        }

        // Verify the email confirmation token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          console.error('❌ Email confirmation error:', error);
          
          if (error.message.includes('already been confirmed')) {
            setState('already_confirmed');
            setMessage('Your email has already been confirmed!');
          } else {
            setState('error');
            setMessage(error.message || 'Failed to confirm email');
          }
        } else {
          console.log('✅ Email confirmed successfully:', data);
          setState('success');
          setMessage('Email confirmed successfully!');
          
          // Redirect to main app after 2 seconds
          setTimeout(() => {
            router.replace('/');
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Email confirmation exception:', error);
        setState('error');
        setMessage('An unexpected error occurred');
      }
    };

    confirmEmail();
  }, [params, router]);

  const renderIcon = () => {
    switch (state) {
      case 'loading':
        return <ActivityIndicator size="large" color="#007AFF" />;
      case 'success':
      case 'already_confirmed':
        return <CheckCircle size={64} color="#34C759" />;
      case 'error':
        return <XCircle size={64} color="#FF3B30" />;
      default:
        return <Mail size={64} color="#007AFF" />;
    }
  };

  const getTitle = () => {
    switch (state) {
      case 'loading':
        return 'Confirming Email...';
      case 'success':
        return 'Email Confirmed!';
      case 'already_confirmed':
        return 'Already Confirmed';
      case 'error':
        return 'Confirmation Failed';
      default:
        return 'Email Confirmation';
    }
  };

  const getSubtitle = () => {
    switch (state) {
      case 'loading':
        return 'Please wait while we confirm your email address...';
      case 'success':
        return 'Your email has been successfully confirmed. Redirecting to the app...';
      case 'already_confirmed':
        return 'Your email address has already been confirmed. You can now sign in.';
      case 'error':
        return message || 'There was an issue confirming your email. Please try again.';
      default:
        return 'Confirming your email address...';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {renderIcon()}
        </View>
        
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>
        
        {(state === 'error' || state === 'already_confirmed') && (
          <Text 
            style={styles.linkText}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            Go to Sign In
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});