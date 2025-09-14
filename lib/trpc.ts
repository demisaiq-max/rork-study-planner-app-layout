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

// Test backend connectivity with comprehensive diagnostics
const testBackendConnection = async () => {
  try {
    const baseUrl = getBaseUrl();
    const healthUrl = `${baseUrl}/api`;
    
    console.log('🏥 Testing backend health at:', healthUrl);
    console.log('🔍 Network environment:', {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      online: typeof navigator !== 'undefined' ? navigator.onLine : 'Unknown',
      platform: typeof process !== 'undefined' ? process.platform : 'Unknown'
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is healthy:', data);
      
      // Test tRPC endpoint specifically
      const trpcTestUrl = `${baseUrl}/api/trpc/tests.supabaseTest`;
      console.log('🔍 Testing tRPC endpoint:', trpcTestUrl);
      
      try {
        const trpcResponse = await fetch(trpcTestUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🔍 tRPC endpoint response:', {
          status: trpcResponse.status,
          statusText: trpcResponse.statusText,
          ok: trpcResponse.ok
        });
      } catch (trpcError) {
        console.warn('⚠️ tRPC endpoint test failed:', trpcError);
      }
      
      return true;
    } else {
      console.error('❌ Backend health check failed:', {
        status: response.status,
        statusText: response.statusText,
        url: healthUrl
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to backend:', {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : String(error),
      url: `${getBaseUrl()}/api`
    });
    return false;
  }
};

// Run health check on initialization with delay to ensure environment is ready
setTimeout(() => {
  testBackendConnection();
}, 1000);

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      headers: () => {
        return {
          'content-type': 'application/json',
          'Accept': 'application/json',
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
          hasBody: !!options?.body,
          timestamp: new Date().toISOString(),
        };
        
        console.log('🚀 tRPC Request:', requestInfo);
        
        // Implement retry logic for network failures
        const maxRetries = 3;
        const baseDelay = 1000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(parsedUrl.toString(), {
              ...options,
              headers: {
                ...options?.headers,
                'content-type': 'application/json',
                'Accept': 'application/json',
              },
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              console.log('✅ tRPC Response Success:', {
                url: parsedUrl.toString(),
                status: response.status,
                statusText: response.statusText,
                timestamp: new Date().toISOString(),
              });
              return response;
            } else {
              const errorInfo = {
                url: parsedUrl.toString(),
                status: response.status,
                statusText: response.statusText,
                attempt,
                maxRetries,
                timestamp: new Date().toISOString(),
              };
              
              console.error('❌ tRPC HTTP Error:', errorInfo);
              
              // Don't retry on 4xx errors
              if (response.status >= 400 && response.status < 500) {
                return response;
              }
              
              // Continue to retry on 5xx errors
              if (attempt === maxRetries) {
                return response;
              }
            }
          } catch (error) {
            const errorInfo = {
              url: parsedUrl.toString(),
              error: error instanceof Error ? {
                message: error.message,
                name: error.name,
                stack: error.stack,
              } : String(error),
              attempt,
              maxRetries,
              timestamp: new Date().toISOString(),
            };
            
            console.error('❌ tRPC Network Error:', errorInfo);
            
            if (attempt === maxRetries) {
              throw error;
            }
            
            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise((resolve) => {
              if (delay > 0) {
                setTimeout(resolve, delay);
              } else {
                resolve(undefined);
              }
            });
          }
        }
        
        // If we get here, all retries failed
        throw new Error('All retry attempts failed');
      },
    }),
  ],
});

console.log('📋 tRPC Client initialized successfully');
console.log('🔗 Available tRPC methods will be logged when used');