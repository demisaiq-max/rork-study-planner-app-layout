import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const getUserProfileProcedure = protectedProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    console.log('Getting user profile for userId:', input.userId);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, profile_picture_url')
        .eq('id', input.userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw new Error('Failed to fetch user profile');
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        profilePictureUrl: data.profile_picture_url,
      };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw new Error('Failed to get user profile');
    }
  });