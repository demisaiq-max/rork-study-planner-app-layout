import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
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
          return response;
        }).catch(error => {
          console.error('tRPC Client Error:', {
            url: url.toString(),
            error: error.message,
          });
          throw error;
        });
      },
    }),
  ],
});