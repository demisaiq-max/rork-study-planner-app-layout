import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const hiProcedure = publicProcedure
  .input(z.object({ name: z.string() }))
  .mutation(({ input }) => {
    return {
      hello: input.name,
      date: new Date(),
    };
  });

export default hiProcedure;

// Add a simple debug procedure
export const debugProcedure = publicProcedure.query(() => {
  return {
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString(),
    procedures: {
      tests: {
        getLatestTestResults: 'available'
      },
      community: {
        posts: { getPosts: 'available' },
        groups: { getGroups: 'available' },
        questions: { getQuestions: 'available' }
      }
    }
  };
});