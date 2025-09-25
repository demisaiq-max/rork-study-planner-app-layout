# Clerk-Supabase Integration Migration Guide

## Problem
The Clerk-Supabase sync is failing because:
1. Clerk uses string IDs (e.g., `user_2abc...`) 
2. Your Supabase database uses UUID type for user IDs
3. The sync fails when trying to insert a string ID into a UUID column

## Solution
We need to migrate your Supabase database to use VARCHAR IDs instead of UUIDs for the users table and all related tables.

## Migration Steps

### Step 1: Backup Your Data (IMPORTANT!)
Before running any migration, backup your existing data if you have any important information.

### Step 2: Run the Migration Script
1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy and paste the entire contents of `database-migration-clerk-integration.sql`
4. Click "Run" to execute the migration

This migration will:
- Change the `users.id` column from UUID to VARCHAR(255)
- Update all foreign key references to use VARCHAR(255)
- Preserve all existing table structures and relationships
- Add support for `profile_picture_url` column

### Step 3: Verify the Migration
After running the migration, verify that:
1. The `users` table now has `id` as VARCHAR(255)
2. The `profile_picture_url` column exists
3. All foreign key relationships are intact

### Step 4: Test the Integration
1. Sign out of your app
2. Sign up with a new account using Clerk (Google, GitHub, or email)
3. Check your Supabase dashboard - you should see the new user in the `users` table
4. The user ID should match the Clerk user ID (e.g., `user_2abc...`)

## What Changed in the Code
1. **Database Types**: Updated `/lib/supabase.ts` to reflect VARCHAR IDs and added `profile_picture_url`
2. **Sync Procedure**: The sync procedure in `/backend/trpc/routes/users/sync-clerk-user/route.ts` already handles the sync correctly

## Troubleshooting

### If you still get sync errors:
1. Make sure you ran the migration script completely
2. Check that the `users` table schema shows `id` as VARCHAR(255) not UUID
3. Clear your app data and try signing up again
4. Check the Supabase logs for any specific error messages

### If you need to rollback:
If something goes wrong and you need to revert to UUIDs, you would need to:
1. Export any Clerk user data
2. Drop all tables
3. Re-run the original `database-schema.sql`
4. Manually migrate any Clerk users

## Important Notes
- This migration is necessary for Clerk integration to work
- All new users created through Clerk will automatically sync to Supabase
- Existing test data with UUID IDs will be removed (the test user `550e8400-e29b-41d4-a716-446655440000`)
- After migration, all user IDs will be Clerk IDs (strings like `user_2abc...`)