import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";

// Exam routes
import getUserExams from "./routes/exams/get-user-exams/route";
import createExam from "./routes/exams/create-exam/route";
import getPriorityExams from "./routes/exams/get-priority-exams/route";

// Grade routes
import getSubjectGrades from "./routes/grades/get-subject-grades/route";
import updateSubjectGrade from "./routes/grades/update-subject-grade/route";
import deleteSubjectGrade from "./routes/grades/delete-subject-grade/route";

// Settings routes
import getUserSettings from "./routes/settings/get-user-settings/route";
import updateUserSettings from "./routes/settings/update-user-settings/route";

// Study session routes
import createStudySession from "./routes/study/create-study-session/route";
import getStudySessions from "./routes/study/get-study-sessions/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  exams: createTRPCRouter({
    getUserExams,
    createExam,
    getPriorityExams,
  }),
  grades: createTRPCRouter({
    getSubjectGrades,
    updateSubjectGrade,
    deleteSubjectGrade,
  }),
  settings: createTRPCRouter({
    getUserSettings,
    updateUserSettings,
  }),
  study: createTRPCRouter({
    createStudySession,
    getStudySessions,
  }),
});

export type AppRouter = typeof appRouter;