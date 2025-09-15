import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { StudyProvider } from "@/hooks/study-store";
import { UserProvider } from "@/hooks/user-context";
import { LanguageProvider } from "@/hooks/language-context";
import { trpc, trpcClient } from "@/lib/trpc";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

console.log('🔑 Clerk publishable key:', publishableKey ? 'Found' : 'Missing');
console.log('🔑 Environment variables:', Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC')));

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
    </Stack>
  );
}

export default function RootLayout() {
  // Create QueryClient inside the component to ensure it's fresh for each app instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && error.message.includes('4')) {
            return false;
          }
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
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
        console.error('❌ tRPC Mutation Error:', {
          error: error instanceof Error ? {
            message: error.message,
            name: error.name,
          } : String(error),
          timestamp: new Date().toISOString(),
        });
      },
    });

    // Log app initialization
    console.log('🚀 App initialized', {
      timestamp: new Date().toISOString(),
      environment: __DEV__ ? 'development' : 'production',
    });
  }, [queryClient]);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <UserProvider>
            <LanguageProvider>
              <StudyProvider>
                <GestureHandlerRootView style={styles.container}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </StudyProvider>
            </LanguageProvider>
          </UserProvider>
        </trpc.Provider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});