import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const syncClerkUserProcedure = publicProcedure
  .input(z.object({
    clerkUserId: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    profilePictureUrl: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log('🔄 Syncing Clerk user to Supabase:', input);
    
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', input.clerkUserId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected for new users
        console.error('Error checking existing user:', checkError);
        throw new Error('Failed to check existing user');
      }

      if (existingUser) {
        console.log('✅ User already exists in Supabase:', existingUser.id);
        
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            email: input.email,
            name: input.name || input.email.split('@')[0],
            profile_picture_url: input.profilePictureUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.clerkUserId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw new Error('Failed to update user');
        }

        console.log('✅ User updated in Supabase:', updatedUser);
        return { user: updatedUser, created: false };
      }

      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: input.clerkUserId,
          email: input.email,
          name: input.name || input.email.split('@')[0],
          profile_picture_url: input.profilePictureUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        
        // If the error is due to missing columns, try without profile_picture_url
        if (insertError.message?.includes('profile_picture_url')) {
          const { data: retryUser, error: retryError } = await supabase
            .from('users')
            .insert({
              id: input.clerkUserId,
              email: input.email,
              name: input.name || input.email.split('@')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (retryError) {
            console.error('Retry error:', retryError);
            throw new Error('Failed to create user');
          }

          console.log('✅ User created in Supabase (without profile picture):', retryUser);
          return { user: retryUser, created: true };
        }
        
        throw new Error('Failed to create user');
      }

      console.log('✅ User created in Supabase:', newUser);
      return { user: newUser, created: true };
    } catch (error: any) {
      console.error('❌ Error in syncClerkUser:', error);
      throw new Error(error.message || 'Failed to sync user');
    }
  });