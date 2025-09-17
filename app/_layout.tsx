import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useMemo, Component, ReactNode } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StudyProvider } from "@/hooks/study-store";
import { UserProvider } from "@/hooks/user-context";
import { LanguageProvider } from "@/hooks/language-context";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { trpc, createAuthenticatedTRPCClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('❌ Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ Error Boundary details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={() => this.setState({ hasError: false, error: undefined })}
          >
            <Text style={errorStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="calendar" options={{ title: "Calendar" }} />
      <Stack.Screen name="brain-manager" options={{ title: "Brain Manager" }} />
      <Stack.Screen name="community-questions" options={{ title: "Community Questions" }} />
      <Stack.Screen name="community-grade" options={{ title: "Community Grade" }} />
      <Stack.Screen name="community-study" options={{ title: "Community Study" }} />
      <Stack.Screen name="exam-management" options={{ title: "Exam Management" }} />
      <Stack.Screen name="priority-management" options={{ title: "Priority Management" }} />
      <Stack.Screen name="exam-selection" options={{ title: "Select Exam" }} />
      <Stack.Screen name="subject-grades" options={{ title: "Subject Grades" }} />
      <Stack.Screen name="subject-tests" options={{ title: "Subject Tests" }} />
      <Stack.Screen name="test-list" options={{ title: "Tests" }} />
      <Stack.Screen name="test-detail" options={{ title: "Test Detail" }} />
      <Stack.Screen name="all-subjects" options={{ title: "All Subjects" }} />
      <Stack.Screen name="timer-sessions" options={{ title: "Timer Sessions" }} />
      <Stack.Screen name="test-results" options={{ title: "Test Results" }} />
      <Stack.Screen name="exam-score-edit" options={{ title: "Edit Exam Score" }} />
      <Stack.Screen name="trpc-debug" options={{ title: "tRPC Debug" }} />
      <Stack.Screen name="supabase-test" options={{ title: "Supabase Test" }} />
    </Stack>
  );
}

// Component that provides authenticated tRPC client
function AuthenticatedTRPCProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  const { session } = useAuth();
  
  // Create a new tRPC client whenever the session changes
  const trpcClient = useMemo(() => {
    console.log('🔄 Creating new tRPC client for session:', session ? 'authenticated' : 'unauthenticated');
    return createAuthenticatedTRPCClient();
  }, [session]); // Recreate when session changes

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
}

export default function RootLayout() {
  // Create QueryClient with optimized settings to prevent hydration timeout
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && error.message.includes('4')) {
            return false;
          }
          // Reduce retries to prevent timeout
          return failureCount < 1;
        },
        retryDelay: 1000, // Fixed delay instead of exponential backoff
        staleTime: 30 * 1000, // 30 seconds - shorter to prevent stale data issues
        gcTime: 5 * 60 * 1000, // 5 minutes
        networkMode: 'online', // Only run queries when online
      },
      mutations: {
        retry: 0, // No retries for mutations to prevent timeout
        networkMode: 'online',
      },
    },
  }));

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('📋 App layout mounted, hiding splash screen...');
        await SplashScreen.hideAsync();
        console.log('✅ Splash screen hidden successfully');
      } catch (error) {
        console.error('❌ Failed to hide splash screen:', error);
      }
    };
    
    initializeApp();

    // Set up global error handler for React Query
    queryClient.setMutationDefaults(['trpc'], {
      onError: (error) => {
        if (error && typeof error === 'object') {
          console.error('❌ tRPC Mutation Error:', {
            error: error instanceof Error ? {
              message: error.message,
              name: error.name,
            } : String(error),
            timestamp: new Date().toISOString(),
          });
        }
      },
    });

    // Log app initialization
    console.log('🚀 App initialized', {
      timestamp: new Date().toISOString(),
      environment: __DEV__ ? 'development' : 'production',
    });
  }, [queryClient]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthenticatedTRPCProvider queryClient={queryClient}>
            <UserProvider>
              <LanguageProvider>
                <StudyProvider>
                  <GestureHandlerRootView style={styles.container}>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </StudyProvider>
              </LanguageProvider>
            </UserProvider>
          </AuthenticatedTRPCProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
