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
import { seedDummyDataProcedure } from "./routes/grades/seed-dummy-data/route";

// Settings routes
import getUserSettings from "./routes/settings/get-user-settings/route";
import updateUserSettings from "./routes/settings/update-user-settings/route";

// Study session routes
import createStudySession from "./routes/study/create-study-session/route";
import getStudySessions from "./routes/study/get-study-sessions/route";

// Test routes
import getSubjectTests from "./routes/tests/get-subject-tests/route";
import createTest from "./routes/tests/create-test/route";
import submitTestResult from "./routes/tests/submit-test-result/route";
import getUserSubjects from "./routes/tests/get-user-subjects/route";
import getLatestTestResults from "./routes/tests/get-latest-test-results/route";
import getTestById from "./routes/tests/get-test-by-id/route";
import createSubject from "./routes/tests/create-subject/route";
import deleteSubject from "./routes/tests/delete-subject/route";
import updateSubject from "./routes/tests/update-subject/route";

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
    seedDummyData: seedDummyDataProcedure,
  }),
  settings: createTRPCRouter({
    getUserSettings,
    updateUserSettings,
  }),
  study: createTRPCRouter({
    createStudySession,
    getStudySessions,
  }),
  tests: createTRPCRouter({
    getSubjectTests,
    createTest,
    submitTestResult,
    getUserSubjects,
    getLatestTestResults,
    getTestById,
    createSubject,
    deleteSubject,
    updateSubject,
  }),
});

export type AppRouter = typeof appRouter;