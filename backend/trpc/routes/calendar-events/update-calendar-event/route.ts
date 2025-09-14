import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const updateCalendarEventProcedure = publicProcedure
  .input(
    z.object({
      id: z.string(),
      userId: z.string(),
      title: z.string(),
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      location: z.string().optional(),
      description: z.string().optional(),
      color: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[updateCalendarEvent] Starting with input:", input);

    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .update({
          title: input.title,
          date: input.date,
          start_time: input.startTime,
          end_time: input.endTime,
          location: input.location,
          description: input.description,
          color: input.color,
        })
        .eq("id", input.id)
        .eq("user_id", input.userId)
        .select()
        .single();

      if (error) {
        console.error("[updateCalendarEvent] Database error:", error);
        throw new Error(`Failed to update calendar event: ${error.message}`);
      }

      console.log("[updateCalendarEvent] Successfully updated event:", data);
      return data;
    } catch (error) {
      console.error("[updateCalendarEvent] Error:", error);
      throw error;
    }
  });