import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Add request logging middleware
app.use("*", async (c, next) => {
  console.log(`🚀 ${c.req.method} ${c.req.url}`);
  try {
    await next();
    console.log(`✅ ${c.req.method} ${c.req.url} - ${c.res.status}`);
  } catch (error) {
    console.error(`❌ ${c.req.method} ${c.req.url} - Error:`, error);
    throw error;
  }
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`❌ tRPC Error on ${path}:`, error);
    },
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// Catch-all route for debugging
app.all("*", (c) => {
  console.log(`⚠️ Unhandled route: ${c.req.method} ${c.req.url}`);
  return c.json({ error: "Route not found", path: c.req.url }, 404);
});

export default app;