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

  // Fallback to Rork development server
  const rorkUrl = 'https://7twaok3a9gdls7o4bz61l.rork.com';
  console.log('🔄 Using Rork development server:', rorkUrl);
  return rorkUrl;
};

let trpcUrl: string;
try {
  // IMPORTANT: The URL should point to /api/trpc without any additional path
  // The tRPC client will append the procedure paths automatically
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
      headers: () => {
        return {
          'content-type': 'application/json',
        };
      },
      fetch: async (url, options) => {
        // Parse the URL to check for path issues
        const urlString = url.toString();
        const parsedUrl = new URL(urlString);
        
        // Log the parsed URL components
        console.log('🔍 tRPC URL Analysis:', {
          full: urlString,
          pathname: parsedUrl.pathname,
          search: parsedUrl.search,
        });
        
        // Check if the path has duplicate 'trpc' segments
        if (parsedUrl.pathname.includes('/trpc/trpc/')) {
          console.warn('⚠️ Duplicate trpc path detected, fixing...');
          parsedUrl.pathname = parsedUrl.pathname.replace('/trpc/trpc/', '/trpc/');
        }
        
        const requestInfo = {
          url: parsedUrl.toString(),
          method: options?.method || 'GET',
          body: options?.body ? (() => {
            try {
              return JSON.parse(options.body as string);
            } catch {
              return options.body;
            }
          })() : undefined,
          timestamp: new Date().toISOString(),
        };
        
        console.log('🚀 tRPC Request:', requestInfo);
        
        try {
          const response = await fetch(parsedUrl.toString(), {
            ...options,
            headers: {
              ...options?.headers,
              'content-type': 'application/json',
            },
          });
          
          const responseInfo = {
            url: parsedUrl.toString(),
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            timestamp: new Date().toISOString(),
          };
          
          if (response.ok) {
            console.log('✅ tRPC Response:', responseInfo);
          } else {
            console.error('❌ tRPC Response Error:', responseInfo);
            
            // Try to get error details from response
            try {
              const errorText = await response.text();
              console.error('❌ Error details:', errorText);
            } catch {
              console.error('❌ Could not read error response');
            }
          }
          
          return response;
        } catch (error) {
          console.error('❌ tRPC Network Error:', {
            url: parsedUrl.toString(),
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
          throw error;
        }
      },
    }),
  ],
});

console.log('📋 tRPC Client initialized successfully');
console.log('🔗 Available tRPC methods will be logged when used');