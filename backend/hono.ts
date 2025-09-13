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
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Add error handling middleware
app.onError((err, c) => {
  console.error('Hono error:', err);
  return c.json({ error: err.message }, 500);
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error('tRPC error:', { path, error: error.message });
    },
  })
);

// Debug endpoint to check available procedures
app.get("/debug/procedures", (c) => {
  const procedures = Object.keys(appRouter._def.procedures);
  return c.json({ 
    status: "ok", 
    procedures,
    count: procedures.length 
  });
});

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;