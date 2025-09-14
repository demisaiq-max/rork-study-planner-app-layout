import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

// Validate that trpc is properly initialized
if (!trpc || typeof trpc.createClient !== 'function') {
  console.error('❌ CRITICAL: tRPC not properly initialized!');
  console.error('trpc object:', trpc);
  console.error('trpc type:', typeof trpc);
}

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
  testBackendConnection().catch((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('❌ Health check failed:', errorMessage);
  });
}, 2000);

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      headers: () => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }),
      fetch: async (url, options) => {
        const urlString = url.toString();
        const parsedUrl = new URL(urlString);
        
        // Fix duplicate trpc paths
        if (parsedUrl.pathname.includes('/trpc/trpc/')) {
          console.warn('⚠️ Duplicate trpc path detected, fixing...');
          parsedUrl.pathname = parsedUrl.pathname.replace('/trpc/trpc/', '/trpc/');
        }
        
        console.log('🚀 tRPC Request:', {
          url: parsedUrl.toString(),
          method: options?.method || 'GET',
          hasBody: !!options?.body,
          timestamp: new Date().toISOString(),
        });
        
        const maxRetries = 3;
        const baseDelay = 1000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
              controller.abort();
              console.log(`⏰ Request timeout after 10s (attempt ${attempt})`);
            }, 10000);
            
            const response = await fetch(parsedUrl.toString(), {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options?.headers,
              },
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            console.log(`✅ tRPC Response (attempt ${attempt}):`, {
              url: parsedUrl.toString(),
              status: response.status,
              ok: response.ok,
              timestamp: new Date().toISOString(),
            });
            
            return response;
          } catch (error) {
            const isLastAttempt = attempt === maxRetries;
            const errorInfo = {
              url: parsedUrl.toString(),
              error: error instanceof Error ? {
                message: error.message,
                name: error.name,
              } : String(error),
              attempt,
              maxRetries,
              isLastAttempt,
              timestamp: new Date().toISOString(),
            };
            
            console.error('❌ tRPC Network Error:', errorInfo);
            
            if (isLastAttempt) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              const networkError = new Error(`Network request failed after ${maxRetries} attempts: ${errorMessage}`);
              networkError.name = 'NetworkError';
              throw networkError;
            }
            
            // Exponential backoff with jitter
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
            console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
            await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, delay));
          }
        }
        
        throw new Error('All retry attempts failed');
      },
    }),
  ],
});

// Utility function to format tRPC errors for display
export const formatTRPCError = (error: any): string => {
  if (!error) return 'Unknown error';
  
  console.log('🔍 Formatting error:', {
    name: error.name,
    message: error.message,
    data: error.data,
    shape: error.shape,
  });
  
  // Handle TRPCClientError
  if (error.name === 'TRPCClientError') {
    // Check for network errors
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      return 'Network connection failed. Please check your internet connection and try again.';
    }
    
    // Check for parse errors (backend not responding with JSON)
    if (error.data?.code === 'PARSE_ERROR') {
      return 'Server is not responding properly. Please try again later.';
    }
    
    // Check for timeout errors
    if (error.message?.includes('timeout') || error.message?.includes('aborted')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    
    // Return the error message if available
    return error.message || 'Server error occurred';
  }
  
  // Handle NetworkError
  if (error.name === 'NetworkError') {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  
  // Handle AbortError (timeout)
  if (error.name === 'AbortError') {
    return 'Request timed out. Please try again.';
  }
  
  // Handle generic errors
  if (error.message) {
    return error.message;
  }
  
  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.';
};

// Global error handler for unhandled tRPC errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'TRPCClientError' || event.reason?.name === 'NetworkError') {
      console.error('❌ Unhandled tRPC Error:', {
        message: event.reason.message,
        name: event.reason.name,
        data: event.reason.data,
        shape: event.reason.shape,
        formatted: formatTRPCError(event.reason),
        timestamp: new Date().toISOString(),
      });
      
      // Prevent the error from being logged to console again
      event.preventDefault();
    }
  });
}

console.log('📋 tRPC Client initialized successfully');
console.log('🔗 Available tRPC methods will be logged when used');