import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const updateQuestionProcedure = protectedProcedure
  .input(
    z.object({
      questionId: z.string(),
      title: z.string().min(1).max(200).optional(),
      content: z.string().min(1).max(2000).optional(),
      subject: z.string().min(1).max(50).optional(),
      tags: z.array(z.string()).max(5).optional(),
      imageUrls: z.array(z.string().url()).max(5).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { questionId, ...updateData } = input;
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }
    const userId = ctx.user.id;

    // First check if the question exists and belongs to the user
    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("user_id")
      .eq("id", questionId)
      .single();

    if (fetchError || !question) {
      throw new Error("Question not found");
    }

    // Check if the user owns the question
    if (question.user_id !== userId) {
      throw new Error("You can only edit your own questions");
    }

    // Filter out undefined values
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdateData).length === 0) {
      throw new Error("No data to update");
    }

    // Update the question
    const { data: updatedQuestion, error: updateError } = await supabase
      .from("questions")
      .update({
        ...filteredUpdateData,
        image_urls: updateData.imageUrls,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error("Failed to update question");
    }

    return updatedQuestion;
  });