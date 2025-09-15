import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const updateUserProfileProcedure = protectedProcedure
  .input(z.object({
    userId: z.string(),
    name: z.string().optional(),
    profilePictureUrl: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log('Updating user profile for userId:', input.userId, input);
    
    try {
      const updateData: any = {};
      
      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      
      if (input.profilePictureUrl !== undefined) {
        updateData.profile_picture_url = input.profilePictureUrl;
      }
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', input.userId)
        .select('id, name, email, profile_picture_url')
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        
        // Check if the error is due to missing column
        if (error.message?.includes('profile_picture_url') || error.code === '42703') {
          console.error('Profile picture column not found. Please run the migration script.');
          
          // If profile_picture_url column doesn't exist, try updating without it
          if (input.profilePictureUrl !== undefined) {
            delete updateData.profile_picture_url;
            
            // Try again without profile_picture_url
            const { data: retryData, error: retryError } = await supabase
              .from('users')
              .update(updateData)
              .eq('id', input.userId)
              .select('id, name, email')
              .single();
              
            if (retryError) {
              console.error('Retry error:', retryError);
              throw new Error('Failed to update user profile');
            }
            
            return {
              id: retryData.id,
              name: retryData.name,
              email: retryData.email,
              profilePictureUrl: null,
            };
          }
        }
        
        throw new Error(`Failed to update user profile: ${error.message}`);
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        profilePictureUrl: data.profile_picture_url || null,
      };
    } catch (error: any) {
      console.error('Error in updateUserProfile:', error);
      throw new Error(error.message || 'Failed to update user profile');
    }
  });