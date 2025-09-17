import { useAuth } from '@/hooks/auth-context';
import { Link, useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, Alert, Image } from 'react-native';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const { signIn, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        Alert.alert('Sign In Failed', result.error);
      } else {
        console.log('✅ Sign in successful, navigating to home');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };



  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/qple45xqsv6c5466aautm' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your studies</Text>
        
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={email}
          placeholder="Enter email"
          placeholderTextColor="#8E8E93"
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading && !isLoading}
        />
        <TextInput
          style={styles.input}
          value={password}
          placeholder="Enter password"
          placeholderTextColor="#8E8E93"
          secureTextEntry={true}
          onChangeText={setPassword}
          autoComplete="current-password"
          editable={!loading && !isLoading}
        />
        
        <TouchableOpacity 
          style={styles.forgotPasswordContainer}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, (loading || isLoading) && styles.buttonDisabled]} 
          onPress={handleSignIn}
          disabled={loading || isLoading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
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
    color: '#000000',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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

  buttonDisabled: {
    opacity: 0.6,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
});