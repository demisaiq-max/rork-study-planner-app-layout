import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const deleteStudyNoteProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { userId } = ctx;
    
    const { error } = await supabase
      .from("study_notes")
      .delete()
      .eq("id", input.id)
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error deleting study note:", error);
      throw new Error("Failed to delete study note");
    }
    
    return { success: true };
  });