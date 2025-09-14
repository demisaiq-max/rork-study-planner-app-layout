import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const createCalendarEventProcedure = publicProcedure
  .input(
    z.object({
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
    console.log("[createCalendarEvent] Starting with input:", input);

    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          user_id: input.userId,
          title: input.title,
          date: input.date,
          start_time: input.startTime,
          end_time: input.endTime,
          location: input.location,
          description: input.description,
          color: input.color,
        })
        .select()
        .single();

      if (error) {
        console.error("[createCalendarEvent] Database error:", error);
        throw new Error(`Failed to create calendar event: ${error.message}`);
      }

      console.log("[createCalendarEvent] Successfully created event:", data);
      return data;
    } catch (error) {
      console.error("[createCalendarEvent] Error:", error);
      throw error;
    }
  });