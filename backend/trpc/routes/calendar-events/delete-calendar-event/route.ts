import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const deleteCalendarEventProcedure = publicProcedure
  .input(
    z.object({
      id: z.string(),
      userId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[deleteCalendarEvent] Starting with input:", input);

    try {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", input.id)
        .eq("user_id", input.userId);

      if (error) {
        console.error("[deleteCalendarEvent] Database error:", error);
        throw new Error(`Failed to delete calendar event: ${error.message}`);
      }

      console.log("[deleteCalendarEvent] Successfully deleted event");
      return { success: true };
    } catch (error) {
      console.error("[deleteCalendarEvent] Error:", error);
      throw error;
    }
  });