import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const getStudyNotesProcedure = protectedProcedure
  .input(
    z.object({
      subject: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    const { userId } = ctx;
    
    let query = supabase
      .from("study_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (input.subject) {
      query = query.eq("subject", input.subject);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching study notes:", error);
      throw new Error("Failed to fetch study notes");
    }
    
    return data || [];
  });