# Database Migration Required

## Profile Picture Feature

To enable the profile picture feature, you need to add a new column to your database.

### Steps to Apply Migration:

1. **Open your Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration Script**
   - Copy the contents of `database-migration-add-profile-picture.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify the Migration**
   - The script will add a `profile_picture_url` column to the `users` table
   - This column will store the URL or base64 data of profile pictures

### Migration Script Content:
```sql
-- Add profile_picture_url column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
```

### Note:
The backend code has been updated to handle both scenarios:
- If the column exists: Profile pictures will work normally
- If the column doesn't exist: The app will gracefully fallback and continue working without profile pictures

After running the migration, the profile picture upload feature will be fully functional.