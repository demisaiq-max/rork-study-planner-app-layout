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
      // First, test the connection
      const { error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase connection test failed:', {
          message: testError.message,
          code: testError.code,
          details: testError.details,
          hint: testError.hint
        });
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', input.clerkUserId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected for new users
        console.error('❌ Error checking existing user:', {
          message: checkError.message,
          code: checkError.code,
          details: checkError.details,
          hint: checkError.hint,
          clerkUserId: input.clerkUserId
        });
        throw new Error(`Failed to check existing user: ${checkError.message}`);
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
          console.error('❌ Error updating user:', {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint
          });
          throw new Error(`Failed to update user: ${updateError.message}`);
        }

        console.log('✅ User updated in Supabase:', updatedUser);
        return { user: updatedUser, created: false };
      }

      // Create new user
      console.log('📝 Creating new user in Supabase...');
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
        console.error('❌ Error creating user:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          userData: {
            id: input.clerkUserId,
            email: input.email,
            name: input.name || input.email.split('@')[0]
          }
        });
        
        // If the error is due to missing columns, try without profile_picture_url
        if (insertError.message?.includes('profile_picture_url')) {
          console.log('🔄 Retrying without profile_picture_url...');
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
            console.error('❌ Retry error:', {
              message: retryError.message,
              code: retryError.code,
              details: retryError.details,
              hint: retryError.hint
            });
            throw new Error(`Failed to create user: ${retryError.message}`);
          }

          console.log('✅ User created in Supabase (without profile picture):', retryUser);
          return { user: retryUser, created: true };
        }
        
        throw new Error(`Failed to create user: ${insertError.message}`);
      }

      console.log('✅ User created in Supabase:', newUser);
      return { user: newUser, created: true };
    } catch (error: any) {
      console.error('❌ Error in syncClerkUser:', {
        message: error.message,
        stack: error.stack,
        input: {
          clerkUserId: input.clerkUserId,
          email: input.email,
          name: input.name
        }
      });
      throw new Error(error.message || 'Failed to sync user');
    }
  });