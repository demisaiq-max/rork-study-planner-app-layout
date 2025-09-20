import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StudyProvider } from "@/hooks/study-store";
import { UserProvider } from "@/hooks/user-context";
import { LanguageProvider } from "@/hooks/language-context";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { trpc, createAuthenticatedTRPCClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
      <Stack.Screen name="question-detail" options={{ title: "Question Detail" }} />
      <Stack.Screen name="group-detail" options={{ title: "Group Detail" }} />
      <Stack.Screen name="oauth-native-callback" options={{ title: "OAuth Callback" }} />
    </Stack>
  );
}

// Component that provides authenticated tRPC client
function AuthenticatedTRPCProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  const { session, isLoading } = useAuth();
  
  // Create a stable tRPC client to prevent hydration issues
  const trpcClient = useMemo(() => {
    console.log('🔄 Creating tRPC client for session:', {
      hasSession: !!session,
      userEmail: session?.user?.email || 'none',
      isLoading
    });
    return createAuthenticatedTRPCClient();
  }, []); // Only create once to prevent hydration mismatch

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
        retry: false, // Disable retries to prevent hydration timeout
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        networkMode: 'online',
        refetchOnWindowFocus: false, // Prevent unnecessary refetches
        refetchOnMount: false, // Prevent refetch on mount to reduce hydration issues
      },
      mutations: {
        retry: false,
        networkMode: 'online',
      },
    },
  }));

  useEffect(() => {
    // Delay splash screen hiding to prevent hydration timeout
    const timer = setTimeout(async () => {
      try {
        console.log('📋 App layout mounted, hiding splash screen...');
        await SplashScreen.hideAsync();
        console.log('✅ Splash screen hidden successfully');
      } catch (error) {
        console.error('❌ Failed to hide splash screen:', error);
      }
    }, 500); // Small delay to allow hydration to complete

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

    return () => clearTimeout(timer);
  }, [queryClient]);

  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
