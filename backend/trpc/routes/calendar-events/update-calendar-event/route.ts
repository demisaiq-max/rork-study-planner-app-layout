import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";

export const updateCalendarEventProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      title: z.string(),
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      location: z.string().optional(),
      description: z.string().optional(),
      color: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log("[updateCalendarEvent] Starting with input:", input);

    try {
      const { data, error } = await ctx.supabase
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
        .eq("user_id", ctx.userId)
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