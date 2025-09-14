#!/usr/bin/env node

// Simple backend server starter
const { serve } = require('@hono/node-server');

async function startServer() {
  try {
    console.log('🚀 Starting backend server...');
    
    // Import the Hono app
    const app = require('./backend/hono.ts').default;
    
    const port = process.env.PORT || 3000;
    
    console.log(`🌐 Server starting on port ${port}`);
    console.log(`📡 tRPC endpoint: http://localhost:${port}/trpc`);
    console.log(`🔍 Debug endpoint: http://localhost:${port}/debug`);
    
    serve({
      fetch: app.fetch,
      port: port,
    });
    
    console.log(`✅ Server is running on http://localhost:${port}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();