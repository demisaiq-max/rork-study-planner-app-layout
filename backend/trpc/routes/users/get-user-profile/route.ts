import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const getUserProfileProcedure = protectedProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    console.log('Getting user profile for userId:', input.userId);
    
    try {
      // First try with profile_picture_url
      let { data, error } = await supabase
        .from('users')
        .select('id, name, email, profile_picture_url')
        .eq('id', input.userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If profile_picture_url column doesn't exist, try without it
        if (error.message?.includes('profile_picture_url') || error.code === '42703') {
          console.log('Profile picture column not found, fetching without it');
          
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', input.userId)
            .single();
            
          if (retryError) {
            console.error('Retry error:', retryError);
            throw new Error('Failed to fetch user profile');
          }
          
          if (!retryData) {
            throw new Error('User not found');
          }
          
          return {
            id: retryData.id,
            name: retryData.name,
            email: retryData.email,
            profilePictureUrl: null,
          };
        }
        
        throw new Error('Failed to fetch user profile');
      }

      if (!data) {
        throw new Error('User not found');
      }
      
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        profilePictureUrl: data.profile_picture_url || null,
      };
    } catch (error: any) {
      console.error('Error in getUserProfile:', error);
      throw new Error(error.message || 'Failed to get user profile');
    }
  });