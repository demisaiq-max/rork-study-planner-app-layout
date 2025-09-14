import { createTRPCRouter } from "./create-context";
import hiRoute, { debugProcedure } from "./routes/example/hi/route";

// Exam routes
import { getUserExams } from "./routes/exams/get-user-exams/route";
import { createExam } from "./routes/exams/create-exam/route";
import { getPriorityExams } from "./routes/exams/get-priority-exams/route";
import { updateExam } from "./routes/exams/update-exam/route";
import { deleteExam } from "./routes/exams/delete-exam/route";


// Grade routes
import { getSubjectGrades } from "./routes/grades/get-subject-grades/route";
import { updateSubjectGrade } from "./routes/grades/update-subject-grade/route";
import { deleteSubjectGrade } from "./routes/grades/delete-subject-grade/route";


// Settings routes
import { getUserSettings } from "./routes/settings/get-user-settings/route";
import { updateUserSettings } from "./routes/settings/update-user-settings/route";

// Study session routes
import { createStudySession } from "./routes/study/create-study-session/route";
import { getStudySessions } from "./routes/study/get-study-sessions/route";

// Test routes
import { getSubjectTests } from "./routes/tests/get-subject-tests/route";
import { createTest } from "./routes/tests/create-test/route";
import { submitTestResult } from "./routes/tests/submit-test-result/route";
import { getUserSubjects } from "./routes/tests/get-user-subjects/route";
import { getLatestTestResults } from "./routes/tests/get-latest-test-results/route";
import { getTestById } from "./routes/tests/get-test-by-id/route";
import { createSubject } from "./routes/tests/create-subject/route";
import { deleteSubject } from "./routes/tests/delete-subject/route";
import { updateSubject } from "./routes/tests/update-subject/route";


// Brain dump routes
import { getBrainDumpsProcedure } from "./routes/brain-dumps/get-brain-dumps/route";
import { createBrainDumpProcedure } from "./routes/brain-dumps/create-brain-dump/route";
import { updateBrainDumpProcedure } from "./routes/brain-dumps/update-brain-dump/route";
import { deleteBrainDumpProcedure } from "./routes/brain-dumps/delete-brain-dump/route";

// Priority task routes
import { getPriorityTasksProcedure } from "./routes/priority-tasks/get-priority-tasks/route";
import { createPriorityTaskProcedure } from "./routes/priority-tasks/create-priority-task/route";
import { updatePriorityTaskProcedure } from "./routes/priority-tasks/update-priority-task/route";
import { deletePriorityTaskProcedure } from "./routes/priority-tasks/delete-priority-task/route";

// Community routes - Posts
import { getPostsProcedure } from "./routes/community/posts/get-posts/route";
import { createPostProcedure } from "./routes/community/posts/create-post/route";
import { likePostProcedure } from "./routes/community/posts/like-post/route";
import { addCommentProcedure } from "./routes/community/posts/add-comment/route";
import { incrementViewProcedure } from "./routes/community/posts/increment-view/route";

// Community routes - Groups
import { getGroupsProcedure } from "./routes/community/groups/get-groups/route";
import { joinGroupProcedure } from "./routes/community/groups/join-group/route";
import { leaveGroupProcedure } from "./routes/community/groups/leave-group/route";

// Community routes - Questions
import { getQuestionsProcedure } from "./routes/community/questions/get-questions/route";
import { createQuestionProcedure } from "./routes/community/questions/create-question/route";
import { addAnswerProcedure } from "./routes/community/questions/add-answer/route";
import { likeQuestionProcedure } from "./routes/community/questions/like-question/route";
import { incrementQuestionViewProcedure } from "./routes/community/questions/increment-view/route";

// Timer routes
import { createTimerSessionProcedure } from "./routes/timers/create-timer-session/route";
import { updateTimerSessionProcedure } from "./routes/timers/update-timer-session/route";
import { getTimerSessionsProcedure } from "./routes/timers/get-timer-sessions/route";
import { getActiveTimerProcedure } from "./routes/timers/get-active-timer/route";
import { createPauseLogProcedure } from "./routes/timers/create-pause-log/route";

// Calendar events routes
import { getCalendarEventsProcedure } from "./routes/calendar-events/get-calendar-events/route";
import { createCalendarEventProcedure } from "./routes/calendar-events/create-calendar-event/route";
import { updateCalendarEventProcedure } from "./routes/calendar-events/update-calendar-event/route";
import { deleteCalendarEventProcedure } from "./routes/calendar-events/delete-calendar-event/route";

// Study notes routes
import { getStudyNotesProcedure } from "./routes/study-notes/get-study-notes/route";
import { createStudyNoteProcedure } from "./routes/study-notes/create-study-note/route";
import { updateStudyNoteProcedure } from "./routes/study-notes/update-study-note/route";
import { deleteStudyNoteProcedure } from "./routes/study-notes/delete-study-note/route";



export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
    debug: debugProcedure,
  }),

  exams: createTRPCRouter({
    getUserExams: getUserExams,
    createExam: createExam,
    updateExam: updateExam,
    deleteExam: deleteExam,
    getPriorityExams: getPriorityExams,

  }),
  grades: createTRPCRouter({
    getSubjectGrades: getSubjectGrades,
    updateSubjectGrade: updateSubjectGrade,
    deleteSubjectGrade: deleteSubjectGrade,

  }),
  settings: createTRPCRouter({
    getUserSettings: getUserSettings,
    updateUserSettings: updateUserSettings,
  }),
  study: createTRPCRouter({
    createStudySession: createStudySession,
    getStudySessions: getStudySessions,
  }),
  tests: createTRPCRouter({
    getSubjectTests: getSubjectTests,
    createTest: createTest,
    submitTestResult: submitTestResult,
    getUserSubjects: getUserSubjects,
    getLatestTestResults: getLatestTestResults,
    getTestById: getTestById,
    createSubject: createSubject,
    deleteSubject: deleteSubject,
    updateSubject: updateSubject,

  }),
  brainDumps: createTRPCRouter({
    getBrainDumps: getBrainDumpsProcedure,
    createBrainDump: createBrainDumpProcedure,
    updateBrainDump: updateBrainDumpProcedure,
    deleteBrainDump: deleteBrainDumpProcedure,
  }),
  priorityTasks: createTRPCRouter({
    getPriorityTasks: getPriorityTasksProcedure,
    createPriorityTask: createPriorityTaskProcedure,
    updatePriorityTask: updatePriorityTaskProcedure,
    deletePriorityTask: deletePriorityTaskProcedure,
  }),
  community: createTRPCRouter({
    posts: createTRPCRouter({
      getPosts: getPostsProcedure,
      createPost: createPostProcedure,
      likePost: likePostProcedure,
      addComment: addCommentProcedure,
      incrementView: incrementViewProcedure,
    }),
    groups: createTRPCRouter({
      getGroups: getGroupsProcedure,
      joinGroup: joinGroupProcedure,
      leaveGroup: leaveGroupProcedure,
    }),
    questions: createTRPCRouter({
      getQuestions: getQuestionsProcedure,
      createQuestion: createQuestionProcedure,
      addAnswer: addAnswerProcedure,
      likeQuestion: likeQuestionProcedure,
      incrementView: incrementQuestionViewProcedure,
    }),
  }),
  timers: createTRPCRouter({
    createTimerSession: createTimerSessionProcedure,
    updateTimerSession: updateTimerSessionProcedure,
    getTimerSessions: getTimerSessionsProcedure,
    getActiveTimer: getActiveTimerProcedure,
    createPauseLog: createPauseLogProcedure,
  }),
  calendarEvents: createTRPCRouter({
    getCalendarEvents: getCalendarEventsProcedure,
    createCalendarEvent: createCalendarEventProcedure,
    updateCalendarEvent: updateCalendarEventProcedure,
    deleteCalendarEvent: deleteCalendarEventProcedure,
  }),
  studyNotes: createTRPCRouter({
    getStudyNotes: getStudyNotesProcedure,
    createStudyNote: createStudyNoteProcedure,
    updateStudyNote: updateStudyNoteProcedure,
    deleteStudyNote: deleteStudyNoteProcedure,
  }),
});

export type AppRouter = typeof appRouter;