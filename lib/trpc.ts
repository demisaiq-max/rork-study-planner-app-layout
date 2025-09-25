import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (baseUrl && typeof baseUrl === 'string' && baseUrl.startsWith('http')) return baseUrl.replace(/\/$/, '');
  return 'https://7twaok3a9gdls7o4bz61l.rork.com';
};

const trpcUrl = `${getBaseUrl()}/api/trpc`;
console.log('🔗 tRPC URL:', trpcUrl);

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    Accept: 'application/json',
  };
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    if (session?.access_token) {
      headers.authorization = `Bearer ${session.access_token}`;
      console.log('🔐 Auth header attached');
    } else {
      console.log('⚠️ No active session (sending unauthenticated request)');
    }
  } catch (error) {
    console.error('❌ getSession failed, sending unauthenticated request:', error);
  }
  return headers;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  // We can't pass controller to outer promise, so use only for fetch in link
  // Here we just implement a generic timeout wrapper fallback
  return new Promise<T>((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) reject(new Error('Request timeout'));
    }, ms);
    promise
      .then((v) => {
        finished = true;
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        finished = true;
        clearTimeout(timer);
        reject(e);
      });
    clearTimeout(timeout);
  });
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      fetch: (url, options) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        return fetch(url, { ...options, signal: controller.signal })
          .finally(() => clearTimeout(timeoutId));
      },
      headers: getAuthHeaders,
    }),
  ],
});

export const createAuthenticatedTRPCClient = () => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: trpcUrl,
        transformer: superjson,
        fetch: (url, options) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(timeoutId));
        },
        headers: getAuthHeaders,
      }),
    ],
  });
};

export const formatTRPCError = (error: unknown): string => {
  if (error instanceof TRPCClientError) {
    return error.message || 'Network request failed';
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Unknown error');
  }
  return 'An unexpected error occurred';
};
