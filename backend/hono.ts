import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// Log server startup
console.log('🚀 Starting Hono server...');
console.log('📦 App router loaded:', typeof appRouter);
console.log('🔧 Available routes:', Object.keys(appRouter as any));


// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'content-type'],
  credentials: true,
}));

// Add error handling middleware
app.onError((err, c) => {
  console.error('Hono error:', err);
  // Always return valid JSON
  return c.json({ 
    error: {
      message: err.message || 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    }
  }, 500);
});

// Add request logging middleware
app.use('/trpc/*', async (c, next) => {
  console.log('tRPC request:', {
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
    headers: Object.fromEntries(c.req.raw.headers.entries()),
  });
  await next();
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error('tRPC error:', { path, error: error.message, stack: error.stack });
      // Return false to use tRPC's default error handling which returns proper JSON
      return false;
    },
    responseMeta() {
      return {
        headers: {
          'content-type': 'application/json',
        },
      };
    },
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// Debug endpoint to check tRPC router
app.get("/debug", (c) => {
  try {
    // Simple debug info without accessing internal _def properties
    const routerKeys = Object.keys(appRouter as any);
    
    // Helper function to get router structure
    const getRouterStructure = (router: any): any => {
      if (!router || typeof router !== 'object') return null;
      
      const structure: any = {};
      Object.keys(router).forEach(key => {
        const value = router[key];
        if (value && typeof value === 'object') {
          // Check if it's a nested router
          if (typeof value.query === 'function' || typeof value.mutate === 'function') {
            structure[key] = 'procedure';
          } else {
            structure[key] = getRouterStructure(value);
          }
        }
      });
      return structure;
    };
    
    const routerStructure = getRouterStructure(appRouter);
    
    return c.json({ 
      status: "ok", 
      message: "tRPC router loaded",
      routerKeys,
      routerType: typeof appRouter,
      routerStructure,
      hasTests: 'tests' in (appRouter as any),
      hasCommunity: 'community' in (appRouter as any)
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return c.json({ 
      status: "error", 
      message: "tRPC router error",
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Catch-all for unmatched routes
app.all("*", (c) => {
  return c.json({ 
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      path: c.req.path
    }
  }, 404);
});

export default app;