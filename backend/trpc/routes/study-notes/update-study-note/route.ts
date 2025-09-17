import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const updateStudyNoteProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      subject: z.string().optional(),
      dueDate: z.string().optional(),
      estimatedTime: z.number().optional(),
      priority: z.enum(["high", "medium", "low"]).optional(),
      description: z.string().optional(),
      completed: z.boolean().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { userId } = ctx;
    const { id, ...updateData } = input;
    
    const updateObject: any = {};
    if (updateData.title !== undefined) updateObject.title = updateData.title;
    if (updateData.subject !== undefined) updateObject.subject = updateData.subject;
    if (updateData.dueDate !== undefined) updateObject.due_date = updateData.dueDate;
    if (updateData.estimatedTime !== undefined) updateObject.estimated_time = updateData.estimatedTime;
    if (updateData.priority !== undefined) updateObject.priority = updateData.priority;
    if (updateData.description !== undefined) updateObject.description = updateData.description;
    if (updateData.completed !== undefined) updateObject.completed = updateData.completed;
    
    const { data, error } = await supabase
      .from("study_notes")
      .update(updateObject)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating study note:", error);
      throw new Error("Failed to update study note");
    }
    
    return data;
  });