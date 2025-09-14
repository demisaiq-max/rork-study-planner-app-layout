import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const getCalendarEventsProcedure = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    console.log("[getCalendarEvents] Starting with input:", input);

    try {
      let query = supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", input.userId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (input.startDate) {
        query = query.gte("date", input.startDate);
      }

      if (input.endDate) {
        query = query.lte("date", input.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[getCalendarEvents] Database error:", error);
        throw new Error(`Failed to fetch calendar events: ${error.message}`);
      }

      console.log(`[getCalendarEvents] Successfully fetched ${data?.length || 0} events`);
      return data || [];
    } catch (error) {
      console.error("[getCalendarEvents] Error:", error);
      throw error;
    }
  });