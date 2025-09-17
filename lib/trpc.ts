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

// Create the tRPC client with timeout and retry configuration
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      fetch: async (url, options) => {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          // Check if response is ok and has valid content type
          if (!response.ok) {
            console.error('❌ tRPC fetch error:', {
              status: response.status,
              statusText: response.statusText,
              url: response.url
            });
          }
          
          // Check content type to ensure it's JSON
          const contentType = response.headers.get('content-type');
          if (contentType && !contentType.includes('application/json')) {
            console.warn('⚠️ Non-JSON response from tRPC:', contentType);
          }
          
          return response;
        } catch (error) {
          console.error('❌ tRPC fetch exception:', error);
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }
      },
      headers: async () => {
        const headers: Record<string, string> = {
          'content-type': 'application/json',
          'Accept': 'application/json',
        };

        try {
          // Add timeout to session request
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), 3000)
          );
          
          const { data: { session } } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as any;
          
          if (session?.access_token) {
            headers['authorization'] = `Bearer ${session.access_token}`;
            console.log('🔐 Adding auth token to tRPC request');
          } else {
            console.log('⚠️ No session found for tRPC request');
          }
        } catch (error) {
          console.error('❌ Error getting session for tRPC:', error);
          // Continue without auth header rather than failing
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
        fetch: async (url, options) => {
          // Add timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          try {
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            
            // Check if response is ok and has valid content type
            if (!response.ok) {
              console.error('❌ tRPC fetch error:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url
              });
            }
            
            // Check content type to ensure it's JSON
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('application/json')) {
              console.warn('⚠️ Non-JSON response from tRPC:', contentType);
            }
            
            return response;
          } catch (error) {
            console.error('❌ tRPC fetch exception:', error);
            throw error;
          } finally {
            clearTimeout(timeoutId);
          }
        },
        headers: async () => {
          const headers: Record<string, string> = {
            'content-type': 'application/json',
            'Accept': 'application/json',
          };

          try {
            // Add timeout to session request
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Session timeout')), 3000)
            );
            
            const { data: { session } } = await Promise.race([
              sessionPromise,
              timeoutPromise
            ]) as any;
            
            if (session?.access_token) {
              headers['authorization'] = `Bearer ${session.access_token}`;
              console.log('🔐 Adding auth token to tRPC request');
            } else {
              console.log('⚠️ No session found for tRPC request');
            }
          } catch (error) {
            console.error('❌ Error getting session for tRPC:', error);
            // Continue without auth header rather than failing
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
