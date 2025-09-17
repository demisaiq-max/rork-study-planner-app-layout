import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const deleteQuestionProcedure = protectedProcedure
  .input(
    z.object({
      questionId: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { questionId } = input;
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }
    const userId = ctx.user.id;

    // First check if the question exists and belongs to the user
    const { data: question, error: fetchError } = await supabase
      .from("community_questions")
      .select("user_id")
      .eq("id", questionId)
      .single();

    if (fetchError || !question) {
      throw new Error("Question not found");
    }

    // Check if the user owns the question
    if (question.user_id !== userId) {
      throw new Error("You can only delete your own questions");
    }

    // Delete the question (cascade will handle related data)
    const { error: deleteError } = await supabase
      .from("community_questions")
      .delete()
      .eq("id", questionId)
      .eq("user_id", userId);

    if (deleteError) {
      throw new Error("Failed to delete question");
    }

    return { success: true };
  });