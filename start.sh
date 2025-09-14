#!/bin/bash

# Simple startup script for the Rork app
echo "🚀 Starting Rork App..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check if bunx is available
if ! command -v bunx &> /dev/null; then
    echo "❌ bunx is not available. Please make sure Bun is properly installed and in your PATH."
    echo "   You may need to restart your terminal or run: source ~/.bashrc"
    exit 1
fi

# Set environment variables
export EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000

echo "✅ Environment variables set"
echo "📡 Backend URL: $EXPO_PUBLIC_RORK_API_BASE_URL"

# Start the app
echo "🎯 Starting the app..."
bunx rork start -p 7twaok3a9gdls7o4bz61l --tunnel