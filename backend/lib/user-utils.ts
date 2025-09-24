import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Ensures a user exists in the database, creating them if they don't exist
 * @param supabase - Supabase client
 * @param userId - User ID from auth
 * @param user - User object from auth context
 * @returns Promise that resolves when user is ensured to exist
 */
export async function ensureUserExists(
  supabase: SupabaseClient,
  userId: string,
  user?: User | null
): Promise<void> {
  // Check if user exists in the database
  const { error: userCheckError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (userCheckError && userCheckError.code === 'PGRST116') {
    // User doesn't exist, create them
    console.log('Creating user record:', userId);
    const { error: userCreateError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: user?.email || 'unknown@example.com',
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Unknown User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (userCreateError) {
      console.error('Error creating user:', userCreateError);
      throw new Error('Failed to create user record');
    }
  } else if (userCheckError) {
    console.error('Error checking user existence:', userCheckError);
    throw new Error('Failed to verify user');
  }
}