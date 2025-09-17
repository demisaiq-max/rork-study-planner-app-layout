import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const deletePostProcedure = protectedProcedure
  .input(
    z.object({
      postId: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { postId } = input;
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }
    const userId = ctx.user.id;

    // First check if the post exists and belongs to the user
    const { data: post, error: fetchError } = await supabase
      .from("daily_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      throw new Error("Post not found");
    }

    // Check if the user owns the post
    if (post.user_id !== userId) {
      throw new Error("You can only delete your own posts");
    }

    // Delete the post (cascade will handle related data)
    const { error: deleteError } = await supabase
      .from("daily_posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", userId);

    if (deleteError) {
      throw new Error("Failed to delete post");
    }

    return { success: true };
  });