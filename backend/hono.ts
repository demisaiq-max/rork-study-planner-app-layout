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
  const fullPath = c.req.path;
  const procedurePath = fullPath.replace('/api/trpc/', '');
  
  console.log('tRPC request:', {
    method: c.req.method,
    fullPath,
    procedurePath,
    url: c.req.url,
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
      console.error('tRPC error:', { 
        path, 
        error: error.message, 
        code: error.code,
        cause: error.cause,
      });
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
    console.log('🔍 Debug endpoint called');
    
    // Simple debug info without accessing internal properties
    const routerKeys = Object.keys(appRouter as any);
    console.log('📋 Router keys:', routerKeys);
    
    return c.json({ 
      status: "ok", 
      message: "tRPC router loaded successfully",
      timestamp: new Date().toISOString(),
      routerKeys,
      routerType: typeof appRouter,
      hasTests: routerKeys.includes('tests'),
      hasCommunity: routerKeys.includes('community'),
      hasExams: routerKeys.includes('exams'),
      hasBrainDumps: routerKeys.includes('brainDumps'),
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'configured' : 'missing'
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return c.json({ 
      status: "error", 
      message: "tRPC router debug failed",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
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