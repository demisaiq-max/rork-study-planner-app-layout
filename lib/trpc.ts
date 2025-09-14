import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Fallback to localhost for development
  console.warn('EXPO_PUBLIC_RORK_API_BASE_URL not set, using localhost:3000');
  return 'http://localhost:3000';
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        console.log('tRPC Client Request:', {
          url: url.toString(),
          method: options?.method,
          headers: options?.headers,
        });
        return fetch(url, options).then(response => {
          console.log('tRPC Client Response:', {
            url: url.toString(),
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
          });
          
          // Check if response is not ok and provide better error info
          if (!response.ok) {
            console.error('tRPC Response Error:', {
              status: response.status,
              statusText: response.statusText,
              url: url.toString()
            });
          }
          
          return response;
        }).catch(error => {
          console.error('tRPC Client Network Error:', {
            url: url.toString(),
            error: error.message,
            name: error.name,
            stack: error.stack
          });
          
          // Provide more specific error messages
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Backend server is not running or not accessible. Please start the backend server.');
          }
          
          throw error;
        });
      },
    }),
  ],
});