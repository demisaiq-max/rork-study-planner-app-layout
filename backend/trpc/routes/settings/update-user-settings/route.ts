import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export const updateUserSettings = publicProcedure
  .input(z.object({
    userId: z.string(),
    visibleSubjects: z.array(z.string()),
  }))
  .mutation(async ({ input }) => {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: input.userId,
        visible_subjects: input.visibleSubjects,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user settings: ${error.message}`);
    }

    return data;
  });

export default updateUserSettings;