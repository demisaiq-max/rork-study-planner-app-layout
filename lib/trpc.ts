import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

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
      headers: () => {
        return {
          'content-type': 'application/json',
          'Accept': 'application/json',
        };
      },

    }),
  ],
});

export const formatTRPCError = (error: unknown): string => {
  if (error instanceof TRPCClientError) {
    return error.message || 'Network request failed';
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred';
};
