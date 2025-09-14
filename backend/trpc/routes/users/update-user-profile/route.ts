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
        throw new Error('Failed to update user profile');
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        profilePictureUrl: data.profile_picture_url,
      };
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw new Error('Failed to update user profile');
    }
  });