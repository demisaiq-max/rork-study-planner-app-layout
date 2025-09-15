import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side use
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bmxtcqpuhfrvnajozzlw.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJteHRjcXB1aGZydm5ham96emx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTQ4NDksImV4cCI6MjA3MjIzMDg0OX0.kDn1-ABfpKfUS7jBaUnSWuzNiUweiFp5dFzsOKNi0S0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  let userId: string | null = null;
  let user = null;
  
  try {
    // Get the Authorization header
    const authHeader = opts.req.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify the JWT token with Supabase
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error('❌ Auth error in tRPC context:', error.message);
      } else if (authUser) {
        userId = authUser.id;
        user = authUser;
        console.log('✅ Authenticated user in tRPC:', userId);
      }
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