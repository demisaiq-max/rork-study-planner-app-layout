import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { createClient } from "@supabase/supabase-js";
import { supabase as baseSupabase } from '../lib/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bmxtcqpuhfrvnajozzlw.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJteHRjcXB1aGZydm5ham96emx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTQ4NDksImV4cCI6MjA3MjIzMDg0OX0.kDn1-ABfpKfUS7jBaUnSWuzNiUweiFp5dFzsOKNi0S0';

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  let userId: string | null = null;
  let user: any = null;
  let supabase = baseSupabase;
  
  try {
    const authHeader = opts.req.headers.get('authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);

      // Verify token using base client
      const { data: { user: authUser }, error } = await baseSupabase.auth.getUser(token);
      if (error) {
        console.error('❌ Auth error in tRPC context:', error.message);
      } else if (authUser) {
        userId = authUser.id;
        user = authUser;
        console.log('✅ Authenticated user in tRPC:', userId);
      }

      // Create a per-request client that forwards the user's JWT for RLS
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    } else {
      console.log('⚠️ No authorization header found in tRPC request');
    }
  } catch (error) {
    console.error('❌ Error getting user in tRPC context:', error);
  }
  
  return {
    req: opts.req,
    userId,
    user,
    supabase,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new Error('Unauthorized');
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});