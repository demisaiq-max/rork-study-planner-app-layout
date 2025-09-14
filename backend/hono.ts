import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";


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
  return new Response(null, { status: 204 });
});

app.onError((err, c) => {
  return c.json({ 
    error: {
      message: err.message || 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    }
  }, 500);
});



// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,


  })
);

app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "API is running"
  });
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