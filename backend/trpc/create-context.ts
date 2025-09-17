import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { supabase } from '../lib/supabase';

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