import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StudyProvider } from "@/hooks/study-store";
import { UserProvider } from "@/hooks/user-context";
import { LanguageProvider } from "@/hooks/language-context";
import { trpc, trpcClient } from "@/lib/trpc";

// Debug tRPC initialization
console.log('🔍 tRPC in _layout.tsx:');
console.log('trpc:', trpc);
console.log('trpcClient:', trpcClient);
console.log('trpc.Provider:', trpc.Provider);
console.log('typeof trpc.Provider:', typeof trpc.Provider);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Enhanced QueryClient with better error handling
const queryClient = new QueryClient({
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
});

// Global error handler for React Query
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
console.log('🚀 App initializing...', {
  timestamp: new Date().toISOString(),
  environment: __DEV__ ? 'development' : 'production',
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
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
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <LanguageProvider>
            <StudyProvider>
              <GestureHandlerRootView style={styles.container}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </StudyProvider>
          </LanguageProvider>
        </UserProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});