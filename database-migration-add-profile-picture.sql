-- Migration to add profile_picture_url column to users table
-- Run this in your Supabase SQL Editor

-- Add profile_picture_url column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Update the existing trigger to handle the new column
-- The trigger will automatically update the updated_at column when profile_picture_url changes