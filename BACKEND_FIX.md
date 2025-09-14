# Rork App - Backend Connection Fix

## Issue
The app is showing "Failed to fetch" errors because the backend server is not running or the environment variables are not set.

## Quick Fix

### 1. Set Environment Variables
The `.env` file has been created with the required environment variable:
```
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000
```

### 2. Start the Backend Server
You have several options to start the backend:

#### Option A: Use the startup script (if bun/bunx is available)
```bash
chmod +x start.sh
./start.sh
```

#### Option B: Use the original command (if bunx is available)
```bash
bunx rork start -p 7twaok3a9gdls7o4bz61l --tunnel
```

#### Option C: Install bun first (if not installed)
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or restart terminal
bunx rork start -p 7twaok3a9gdls7o4bz61l --tunnel
```

### 3. Verify Backend is Running
Once the backend starts, you should see:
- Server running on port 3000
- tRPC endpoint available at `/trpc`
- Debug endpoint at `/debug`

### 4. Test the Connection
Open your browser and visit:
- `http://localhost:3000` - Should show API status
- `http://localhost:3000/debug` - Should show tRPC router info

## What Was Fixed

1. **Environment Variables**: Created `.env` file with `EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000`

2. **Better Error Handling**: Updated tRPC client to provide more specific error messages when backend is not running

3. **Retry Functionality**: Added tap-to-retry functionality in the UI for failed requests

4. **Debug Logging**: Enhanced logging in the app router to help identify missing procedures

5. **Startup Scripts**: Created helper scripts to start the backend server

## Troubleshooting

If you still see connection errors:

1. **Check if backend is running**: Look for console logs showing server startup
2. **Verify port 3000 is free**: Make sure no other service is using port 3000
3. **Check network connectivity**: Ensure localhost is accessible
4. **Restart the app**: After starting backend, restart the Expo app

## Error Messages Explained

- `"Backend server is not running"` - The backend server at localhost:3000 is not accessible
- `"Failed to fetch"` - Network connection issue, usually means backend is down
- `"No procedure found"` - tRPC procedure is missing from the router (backend issue)

The app will now show more helpful error messages and allow you to retry failed requests by tapping on the error cards.