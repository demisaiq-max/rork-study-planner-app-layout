import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, Alert, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/hooks/auth-context';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const { signUp, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, name);
      
      if (result.error) {
        Alert.alert('Sign Up Failed', result.error);
      } else {
        console.log('✅ Sign up successful, email confirmation required');
        Alert.alert(
          'Check Your Email', 
          'We\'ve sent you a confirmation email. Please click the link in the email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/sign-in')
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Sign up error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };





  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/jaodno8vz0lkalw16sawh' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Study Buddy to track your progress</Text>
        
        <TextInput
          style={styles.input}
          value={name}
          placeholder="Enter your name (optional)"
          placeholderTextColor="#666"
          onChangeText={setName}
          autoComplete="name"
          editable={!loading && !isLoading}
        />
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={email}
          placeholder="Enter email"
          placeholderTextColor="#666"
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading && !isLoading}
        />
        <TextInput
          style={styles.input}
          value={password}
          placeholder="Enter password (min 6 characters)"
          placeholderTextColor="#666"
          secureTextEntry={true}
          onChangeText={setPassword}
          autoComplete="new-password"
          editable={!loading && !isLoading}
        />
        <TouchableOpacity 
          style={[styles.button, (loading || isLoading) && styles.buttonDisabled]} 
          onPress={handleSignUp}
          disabled={loading || isLoading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
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
    color: '#1a1a1a',
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 180,
    height: 180,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});