import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export const syncSupabaseUserProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    profilePictureUrl: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { supabase } = ctx;
    console.log('🔄 Syncing Supabase user to database:', {
      userId: input.userId,
      email: input.email,
      hasName: !!input.name,
      hasProfilePicture: !!input.profilePictureUrl
    });
    
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
        .eq('id', input.userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected for new users
        console.error('❌ Error checking existing user:', {
          message: checkError.message,
          code: checkError.code,
          details: checkError.details,
          hint: checkError.hint,
          userId: input.userId
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
          .eq('id', input.userId)
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
      console.log('📝 Creating new user in database...');
      const userData: any = {
        id: input.userId,
        email: input.email,
        name: input.name || input.email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Only add profile_picture_url if it exists
      if (input.profilePictureUrl) {
        userData.profile_picture_url = input.profilePictureUrl;
      }
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating user:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          userData: {
            id: input.userId,
            email: input.email,
            name: input.name || input.email.split('@')[0]
          }
        });
        
        // Try to provide more helpful error information
        console.error('❌ Failed to create user. Checking if it\'s a constraint issue...');
        
        // Check if user already exists (race condition)
        const { data: existingUserCheck } = await supabase
          .from('users')
          .select('id')
          .eq('id', input.userId)
          .single();
          
        if (existingUserCheck) {
          console.log('✅ User was created by another process, returning existing user');
          return { user: existingUserCheck, created: false };
        }
        
        throw new Error(`Failed to create user: ${insertError.message}`);
      }

      console.log('✅ User created in database:', {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      });
      
      // The database trigger should automatically create unified subjects for this user
      console.log('📝 Unified subjects should be created automatically by database trigger');
      
      return { user: newUser, created: true };
    } catch (error: any) {
      console.error('❌ Error in syncSupabaseUser:', {
        message: error.message,
        stack: error.stack,
        input: {
          userId: input.userId,
          email: input.email,
          name: input.name
        }
      });
      throw new Error(error.message || 'Failed to sync user');
    }
  });