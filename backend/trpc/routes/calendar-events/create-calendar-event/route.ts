import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { ensureUserExists } from "@/backend/lib/user-utils";

export const createCalendarEventProcedure = protectedProcedure
  .input(
    z.object({
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
    console.log("[createCalendarEvent] Starting with input:", input);

    try {
      // Ensure user exists in the database first
      await ensureUserExists(ctx.supabase, ctx.userId, ctx.user);
      
      const { data, error } = await ctx.supabase
        .from("calendar_events")
        .insert({
          user_id: ctx.userId,
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