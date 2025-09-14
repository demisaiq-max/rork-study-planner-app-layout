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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
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
    console.error('❌ Server connection failed:', {
      error: error instanceof Error ? error.message : String(error),
      url: `${getBaseUrl()}/api`
    });
    return false;
  }
};

// Run health check on initialization with delay to ensure environment is ready
setTimeout(() => {
  testBackendConnection().catch(err => {
    console.error('❌ Health check failed:', err);
  });
}, 2000);

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
        const maxRetries = 2;
        const baseDelay = 1000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduced timeout
            
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
                timestamp: new Date().toISOString(),
              });
              return response;
            } else {
              const errorText = await response.text().catch(() => 'Unable to read response');
              const errorInfo = {
                url: parsedUrl.toString(),
                status: response.status,
                statusText: response.statusText,
                responseText: errorText.substring(0, 200), // Limit log size
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
              } : String(error),
              attempt,
              maxRetries,
              timestamp: new Date().toISOString(),
            };
            
            console.error('❌ tRPC Network Error:', errorInfo);
            
            if (attempt === maxRetries) {
              // Create a more informative error
              const networkError = new Error(`Network request failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
              networkError.name = 'NetworkError';
              throw networkError;
            }
            
            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise((resolve) => {
              setTimeout(resolve, delay);
            });
          }
        }
        
        // If we get here, all retries failed
        throw new Error('All retry attempts failed');
      },
    }),
  ],
});

// Global error handler for unhandled tRPC errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'TRPCClientError') {
      console.error('❌ Unhandled tRPC Error:', {
        message: event.reason.message,
        data: event.reason.data,
        shape: event.reason.shape,
      });
    }
  });
}

console.log('📋 tRPC Client initialized successfully');
console.log('🔗 Available tRPC methods will be logged when used');