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

// Enhanced CORS configuration for all environments
app.use("*", cors({
  origin: (origin, c) => {
    // Allow all localhost variants for development
    if (!origin) return '*'; // Allow requests with no origin (mobile apps)
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19000', // Expo default
      'http://localhost:19006', // Expo web
      'http://127.0.0.1:3000',
      'http://127.0.0.1:19000',
      'http://127.0.0.1:19006',
      'exp://localhost:19000', // Expo scheme
      'exp://127.0.0.1:19000',
    ];
    
    // Check if origin matches allowed patterns
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isRorkDomain = origin.includes('.rork.com');
    
    if (allowedOrigins.includes(origin) || isLocalhost || isRorkDomain) {
      return origin;
    }
    
    return '*'; // Fallback for development
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Cache-Control',
    'X-Mx-ReqToken',
    'Keep-Alive',
    'content-type'
  ],
  exposeHeaders: ['Content-Length'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Add preflight handling for all routes
app.options("*", (c) => {
  return new Response("", { status: 204 });
});

// Enhanced error handling middleware
app.onError((err, c) => {
  console.error('Hono error details:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    timestamp: new Date().toISOString(),
    url: c.req.url,
    method: c.req.method,
  });
  
  return c.json({ 
    error: {
      message: err.message || 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
    }
  }, 500);
});

// Enhanced request logging middleware
app.use('/trpc/*', async (c, next) => {
  const start = Date.now();
  const fullPath = c.req.path;
  const procedurePath = fullPath.replace('/api/trpc/', '');
  
  console.log('tRPC request started:', {
    method: c.req.method,
    fullPath,
    procedurePath,
    url: c.req.url,
    userAgent: c.req.header('user-agent'),
    origin: c.req.header('origin'),
    timestamp: new Date().toISOString(),
  });
  
  await next();
  
  const duration = Date.now() - start;
  console.log('tRPC request completed:', {
    procedurePath,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  });
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
  return c.json({ 
    status: "ok", 
    message: "API is running",
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY ? 'configured' : 'missing',
      apiBaseUrl: process.env.EXPO_PUBLIC_RORK_API_BASE_URL ? 'configured' : 'missing'
    }
  });
});

// Direct Supabase test endpoint
app.get("/test-supabase", async (c) => {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      return c.json({ 
        status: "error", 
        message: "Supabase connection failed",
        error: error.message,
        details: error,
        timestamp: new Date().toISOString()
      }, 500);
    }
    
    return c.json({ 
      status: "ok", 
      message: "Supabase connection successful",
      hasData: !!data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Supabase test error:', error);
    return c.json({ 
      status: "error", 
      message: "Supabase test failed",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, 500);
  }
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