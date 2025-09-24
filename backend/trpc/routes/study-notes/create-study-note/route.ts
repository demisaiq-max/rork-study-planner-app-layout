import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";
import { ensureUserExists } from "@/backend/lib/user-utils";

export const createStudyNoteProcedure = protectedProcedure
  .input(
    z.object({
      title: z.string().min(1, "Title is required"),
      subject: z.string().optional(),
      dueDate: z.string().optional(),
      estimatedTime: z.number().optional(),
      priority: z.enum(["high", "medium", "low"]).default("medium"),
      description: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { userId } = ctx;
    
    // Ensure user exists in the database first
    await ensureUserExists(ctx.supabase, userId, ctx.user);
    
    const { data, error } = await supabase
      .from("study_notes")
      .insert({
        user_id: userId,
        title: input.title,
        subject: input.subject,
        due_date: input.dueDate,
        estimated_time: input.estimatedTime,
        priority: input.priority,
        description: input.description,
        completed: false,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating study note:", error);
      throw new Error("Failed to create study note");
    }
    
    return data;
  });