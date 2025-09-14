import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  console.log('🌐 tRPC Base URL Configuration:', {
    envVar: 'EXPO_PUBLIC_RORK_API_BASE_URL',
    value: baseUrl,
    configured: !!baseUrl
  });
  
  if (baseUrl) {
    return baseUrl;
  }

  throw new Error(
    "❌ No base URL found, please set EXPO_PUBLIC_RORK_API_BASE_URL environment variable"
  );
};

let trpcUrl: string;
try {
  trpcUrl = `${getBaseUrl()}/api/trpc`;
  console.log('✅ tRPC Client URL:', trpcUrl);
} catch (error) {
  console.error('❌ Failed to get tRPC URL:', error);
  throw error;
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      fetch: (url, options) => {
        const requestInfo = {
          url: url.toString(),
          method: options?.method || 'GET',
          timestamp: new Date().toISOString(),
        };
        
        console.log('🚀 tRPC Request:', requestInfo);
        
        return fetch(url, options)
          .then(response => {
            const responseInfo = {
              url: url.toString(),
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
              timestamp: new Date().toISOString(),
            };
            
            console.log(response.ok ? '✅ tRPC Response:' : '❌ tRPC Response:', responseInfo);
            
            if (!response.ok) {
              console.error('❌ tRPC HTTP Error:', {
                status: response.status,
                statusText: response.statusText,
                url: url.toString()
              });
            }
            
            return response;
          })
          .catch(error => {
            console.error('❌ tRPC Network Error:', {
              url: url.toString(),
              error: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString(),
            });
            throw error;
          });
      },
    }),
  ],
});

console.log('📋 tRPC Client initialized successfully');
console.log('🔗 Available tRPC methods will be logged when used');