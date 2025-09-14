import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

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
    const routerDef = (appRouter as any)._def;
    const procedures = routerDef.procedures || {};
    const record = routerDef.record || {};
    
    // Helper function to recursively get all procedure paths
    const getAllProcedurePaths = (obj: any, prefix = ''): string[] => {
      const paths: string[] = [];
      
      if (obj && typeof obj === 'object') {
        if (obj._def && obj._def.procedures) {
          // This is a procedure
          Object.keys(obj._def.procedures).forEach(key => {
            paths.push(prefix + key);
          });
        } else if (obj._def && obj._def.record) {
          // This is a nested router
          Object.keys(obj._def.record).forEach(key => {
            const nestedPaths = getAllProcedurePaths(obj._def.record[key], prefix + key + '.');
            paths.push(...nestedPaths);
          });
        } else {
          // Check if it's a direct object with procedures
          Object.keys(obj).forEach(key => {
            if (obj[key] && typeof obj[key] === 'object') {
              const nestedPaths = getAllProcedurePaths(obj[key], prefix + key + '.');
              paths.push(...nestedPaths);
            }
          });
        }
      }
      
      return paths;
    };
    
    const allPaths = getAllProcedurePaths(appRouter);
    
    return c.json({ 
      status: "ok", 
      message: "tRPC router loaded",
      procedureKeys: Object.keys(procedures),
      recordKeys: Object.keys(record),
      routerType: typeof appRouter,
      hasTests: 'tests' in record,
      hasCommunity: 'community' in record,
      testsKeys: record.tests ? Object.keys((record.tests as any)._def.record || {}) : [],
      communityKeys: record.community ? Object.keys((record.community as any)._def.record || {}) : [],
      allProcedurePaths: allPaths
    });
  } catch (error) {
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