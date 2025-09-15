import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (baseUrl) {
    return baseUrl;
  }

  return 'https://7twaok3a9gdls7o4bz61l.rork.com';
};

const trpcUrl = `${getBaseUrl()}/api/trpc`;

// Create the tRPC client
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      headers: async () => {
        const headers: Record<string, string> = {
          'content-type': 'application/json',
          'Accept': 'application/json',
        };

        try {
          // Get the current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.access_token) {
            headers['authorization'] = `Bearer ${session.access_token}`;
            console.log('🔐 Adding auth token to tRPC request');
          } else {
            console.log('⚠️ No session found for tRPC request');
          }
        } catch (error) {
          console.error('❌ Error getting session for tRPC:', error);
        }

        return headers;
      },
    }),
  ],
});

// Helper function to create an authenticated tRPC client for use in React components
export const createAuthenticatedTRPCClient = () => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: trpcUrl,
        transformer: superjson,
        headers: async () => {
          const headers: Record<string, string> = {
            'content-type': 'application/json',
            'Accept': 'application/json',
          };

          try {
            // Get the current session
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.access_token) {
              headers['authorization'] = `Bearer ${session.access_token}`;
              console.log('🔐 Adding auth token to tRPC request');
            } else {
              console.log('⚠️ No session found for tRPC request');
            }
          } catch (error) {
            console.error('❌ Error getting session for tRPC:', error);
          }

          return headers;
        },
      }),
    ],
  });
};

export const formatTRPCError = (error: unknown): string => {
  if (error instanceof TRPCClientError) {
    return error.message || 'Network request failed';
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred';
};
