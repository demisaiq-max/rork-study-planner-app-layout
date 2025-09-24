import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'ko' | 'en';

export interface Translation {
  [key: string]: string;
}

const translations: Record<Language, Translation> = {
  ko: {
    // Header
    examType: '대학수학능력시험',
    userName: '학구몬',
    
    // Timer Card
    timerTitle: '실시간 모의고사 채점하기',
    currentGrade: '아구몬님의\n현재 성적',
    averageGrade: '평균 등급',
    
    // Subjects
    subjectsTitle: '과목별 성적',
    editButton: '편집',
    korean: '국어',
    english: '영어',
    math: '수학',
    science: '탐구',
    expectedGrade: '예상등급',
    gradeUnit: '등급',
    undetermined: '미정',
    
    // Priority Tasks
    priorityTasksTitle: '우선 순위 Top 3',
    emptyPriorityText: '우선순위 일정을 추가해보세요',
    
    // Goals
    goalsTitle: '모든 생각 쏟아내기',
    morningAdjustment: '아침 조정하기',
    
    // Modals
    addExamTitle: '새 시험 추가',
    addTaskTitle: '일정 등록',
    save: '저장',
    examName: '시험명',
    examDate: '시험 날짜',
    examDescription: '시험 설명 (선택사항)',
    importance: '중요도',
    high: '높음',
    medium: '보통',
    low: '낮음',
    taskTitle: '일정 제목',
    description: '설명 (선택사항)',
    setPriority: '우선순위로 설정',
    
    // Placeholders
    examNamePlaceholder: '예: 중간고사, 모의고사 등',
    examDatePlaceholder: 'YYYY.MM.DD 형식으로 입력',
    examDescPlaceholder: '시험에 대한 추가 정보를 입력하세요',
    taskTitlePlaceholder: '일정 제목을 입력하세요',
    taskDescPlaceholder: '일정에 대한 추가 설명을 입력하세요',
    
    // Alerts
    error: '오류',
    notification: '알림',
    examFormError: '시험명과 날짜를 모두 입력해주세요.',
    futureDateError: '미래 날짜를 입력해주세요.',
    taskTitleError: '일정 제목을 입력해주세요.',
    priorityLimitError: '우선순위는 최대 3개까지만 설정할 수 있습니다.',
    
    // Settings
    settings: '설정',
    profile: '프로필',
    name: '이름',
    profilePicture: '프로필 사진',
    language: '언어',
    korean_lang: '한국어',
    english_lang: 'English',
    loading: '로딩 중...',
    
    // Tab Navigation
    home: '홈',
    timer: '타이머',
    notes: '목록',
    stats: '성적관리',
    community: '커뮤니티',
    
    // Community
    studyVerification: '오늘의 공부 인증',
    gradeGroups: '내 등급 모임',
    questionHelp: '문제질문하기',
    publicPost: '공부인증',
    
    // Notes
    studyNotes: '학습 노트',
    searchTasks: '할 일 검색...',
    totalTasks: '전체 할 일',
    completed: '완료됨',
    taskProgress: '진행률',
    all: '전체',
    noDueDate: '마감일 없음',
    min: '분',
    editTask: '할 일 수정',
    addNewTask: '새 할 일 추가',
    subject: '과목',
    enterSubject: '과목 입력',
    dueDate: '마감일',
    estimatedTime: '예상 시간',
    enterTimeInMinutes: '시간을 분 단위로 입력',
    priority: '우선순위',
    cancel: '취소',
    update: '수정',
    add: '추가',
    task: '할 일',
    delete: '삭제',
    deleteTask: '할 일 삭제',
    deleteTaskConfirm: '이 할 일을 삭제하시겠습니까?',
    
    // Timer
    focusTimer: '집중 타이머',
    generalTimer: '일반 타이머',
    teaBreak: '차 휴식',
    lunchBreak: '점심 휴식',
    stayFocused: '집중하고, 생산적으로',
    enjoyYourTea: '차 한 잔의 여유를',
    enjoyYourMeal: '맛있는 식사 시간',
    pomodoro: '뽀모도로',
    shortBreak: '짧은 휴식',
    longBreak: '긴 휴식',
    focusTime: '집중 시간',
    breakTime: '휴식 시간',
    elapsedTime: '경과 시간',
    teaTime: '차 시간',
    lunchTime: '점심 시간',
    pomodoros: '뽀모도로',
    sessions: '세션',
    hours: '시간',
    minutes: '분',
    seconds: '초',
    totalFocus: '총 집중 시간',
    setTimerDuration: '타이머 시간 설정',
    setTimer: '설정',
    timerComplete: '타이머 완료!',
    sessionFinished: '세션이 완료되었습니다.',
    sessionSaved: '세션 저장됨',
    sessionSavedMessage: '세션이 저장되었습니다.',
    timerRunning: '타이머 실행 중',
    stopTimerFirst: '먼저 타이머를 정지해주세요.',
    recentSessions: '최근 세션',
    timerSession: '타이머 세션',
    
    // Stats
    progress: '진행 상황 추적',
    todayStudy: '오늘의 공부',
    thisWeek: '이번 주',
    monthlyGoal: '월간 목표',
    dayStreak: '연속 일수',
    weeklyOverview: '주간 개요',
    subjectDistribution: '과목별 분포',
    timeDistribution: '시간 분포',
    recentAchievements: '최근 성과',
    noStudyDataYet: '아직 공부 데이터가 없습니다',
    startStudyingToSeeStats: '공부를 시작하여 통계를 확인하세요',
    dayStreakAchievement: '일 연속',
    current: '현재',
    notStarted: '시작 안함',
    hoursThisWeek: '시간 이번 주',
    monthlyProgress: '월간 진행률',
    hoursToday: '시간 오늘',
    today: '오늘',
    
    // Exam Management
    examManagement: '시험 관리',
    manageExams: '시험 관리하기',
    manageExamsDesc: '시험을 추가, 수정, 삭제할 수 있습니다',
    noExams: '등록된 시험이 없습니다',
    noExamsDesc: '첫 번째 시험을 추가해보세요',
    addNewExam: '새 시험 추가',
    editExam: '시험 수정',
    deleteExam: '시험 삭제',
    deleteExamConfirm: '이 시험을 삭제하시겠습니까?',
    editGrades: '성적 편집',
    
    // Subject Grades
    subjectGrades: '과목별 성적',
    targetPercentile: '목표 백분위',
    averagePercentile: '평균 백분위',
    recentPercentile: '최근 백분위',
    examTypeLabel: '시험 유형',
    mockTest: '모의고사',
    midterm: '중간고사',
    finalExam: '기말고사',
    mockTests: '모의고사',
    midtermTests: '중간고사',
    finalTests: '기말고사',
    mockTestGrades: '모의고사 성적',
    midtermGrades: '중간고사 성적',
    finalGrades: '기말고사 성적',
    gradeHistory: '성적 변화',
    mockShort: '모의',
    midtermShort: '중간',
    finalShort: '기말',
    grade1: '1등급',
    grade2: '2등급',
    grade3: '3등급',
    grade4: '4등급',
    grade5: '5등급',
    grade6: '6등급',
    grade7: '7등급',
    grade8: '8등급',
    grade9: '9등급',
    noGrade: '미정',
    deleteGrade: '성적 삭제',
    deleteGradeConfirm: '이 과목의 성적을 삭제하시겠습니까?',
    addSubject: '과목 추가',
    enterSubjectName: '과목명을 입력하세요',
    subjectName: '과목명',
    arts: '예체능',
    noSubjectsAdded: '추가된 과목이 없습니다',
    subjectAlreadyExists: '이미 존재하는 과목입니다',
    failedToUpdateGrade: '성적 업데이트에 실패했습니다',
    failedToDeleteGrade: '성적 삭제에 실패했습니다',
    failedToAddSubject: '과목 추가에 실패했습니다',
    testTypes: '시험 유형',
    tests: '시험',
    latestGrade: '최근 성적',
    noTestsFound: '시험을 찾을 수 없습니다',
    addTestsToGetStarted: '시험을 추가하여 시작하세요',
    subjects: '과목',
    noSubjectsFound: '과목을 찾을 수 없습니다',
    takeTestsToSeeSubjects: '시험을 치러 과목을 확인하세요',
    noGradesYet: '아직 성적이 없습니다',
    addFirstTest: '첫 번째 시험을 추가하세요',
    addTest: '시험 추가',
    addNewTest: '새 시험 추가',
    testName: '시험명',
    testDate: '시험 날짜',
    optional: '선택사항',
    create: '생성',
    creating: '생성 중',
    enterTestName: '시험명을 입력하세요',
    failedToCreateTest: '시험 생성에 실패했습니다',
    uploadAnswerSheet: '답안지 업로드',
    createSubject: '과목 생성',
    editSubject: '과목 수정',
    deleteSubject: '과목 삭제',
    deleteSubjectConfirmation: '이 과목과 관련된 모든 시험 데이터가 삭제됩니다. 계속하시겠습니까?',
    failedToDeleteSubject: '과목 삭제에 실패했습니다',
    failedToUpdateSubject: '과목 수정에 실패했습니다',
    subjectOptions: '과목 옵션',
    chooseAction: '작업을 선택하세요',
    edit: '수정',
    updating: '수정 중',
    testDetail: '시험 상세',
    answerSheet: '답안지',
    uploadDescription: '답안지 사진을 업로드하여 자동으로 성적을 분석받으세요',
    takePhoto: '사진 촬영',
    chooseFromLibrary: '갤러리에서 선택',
    analyzing: '분석 중',
    analyzeResults: '결과 분석',
    analysisError: '분석 중 오류가 발생했습니다',
    testResultSubmitted: '시험 결과가 제출되었습니다',
    permissionRequired: '권한이 필요합니다',
    cameraPermissionRequired: '카메라 권한이 필요합니다',
    success: '성공',

    newAnswerKeyTitle: '새 답안 키',
    templateName: '템플릿 이름',
    templateNamePlaceholder: '예: 수학 모의고사 A',
    subjectLabel: '과목',
    mathematics: '수학',
    others: '기타',
    answerKeyTestType: '시험 유형',
    questions: '문항 수',
    mcq: '객관식',
    textQuestion: '주관식',
    total: '총합',
    answerKeys: '답안 키',
    searchTemplates: '템플릿 검색',
    adminOnlyCreationHint: '관리자만 생성할 수 있습니다. 관리자 계정으로 로그인하세요.',
    failedToLoad: '불러오기에 실패했습니다',
    practice: '연습',
    mock: '모의고사',
    final: '기말고사',
    qsShort: '문항',
    answerKeySaved: '답안 키가 저장되었습니다',
    templateUpdated: '템플릿이 업데이트되었습니다',
    saveTemplate: '템플릿 저장',
    deleteAnswerKey: '답안 키 삭제',
    deleteAnswerKeyConfirm: '이 답안 키를 삭제하시겠습니까?',
    failedToDelete: '삭제에 실패했습니다',
  },
  en: {
    // Header
    examType: 'College Scholastic Ability Test',
    userName: 'Study Mon',
    
    // Timer Card
    timerTitle: 'Real-time Mock Test Scoring',
    currentGrade: 'Your Current\nGrade',
    averageGrade: 'Average Grade',
    
    // Subjects
    subjectsTitle: 'Subject Grades',
    editButton: 'Edit',
    korean: 'Korean',
    english: 'English',
    math: 'Math',
    science: 'Science',
    expectedGrade: 'Expected',
    gradeUnit: 'Grade',
    undetermined: 'TBD',
    
    // Priority Tasks
    priorityTasksTitle: 'Top 3 Priorities',
    emptyPriorityText: 'Add priority tasks',
    
    // Goals
    goalsTitle: 'Brain Dump',
    morningAdjustment: 'Morning Adjustment',
    
    // Modals
    addExamTitle: 'Add New Exam',
    addTaskTitle: 'Add Task',
    save: 'Save',
    examName: 'Exam Name',
    examDate: 'Exam Date',
    examDescription: 'Exam Description (Optional)',
    importance: 'Importance',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    taskTitle: 'Task Title',
    description: 'Description (Optional)',
    setPriority: 'Set as Priority',
    
    // Placeholders
    examNamePlaceholder: 'e.g., Midterm, Mock Test',
    examDatePlaceholder: 'Enter in YYYY.MM.DD format',
    examDescPlaceholder: 'Enter additional exam information',
    taskTitlePlaceholder: 'Enter task title',
    taskDescPlaceholder: 'Enter additional task description',
    
    // Alerts
    error: 'Error',
    notification: 'Notice',
    examFormError: 'Please enter both exam name and date.',
    futureDateError: 'Please enter a future date.',
    taskTitleError: 'Please enter a task title.',
    priorityLimitError: 'You can set up to 3 priority tasks only.',
    
    // Settings
    settings: 'Settings',
    profile: 'Profile',
    name: 'Name',
    profilePicture: 'Profile Picture',
    language: 'Language',
    korean_lang: '한국어',
    english_lang: 'English',
    loading: 'Loading...',
    
    // Tab Navigation
    home: 'Home',
    timer: 'Timer',
    notes: 'Notes',
    stats: 'Stats',
    community: 'Community',
    
    // Community
    studyVerification: 'Study Verification',
    gradeGroups: 'Grade Groups',
    questionHelp: 'Question Help',
    publicPost: 'Study Post',
    
    // Notes
    studyNotes: 'Study Notes',
    searchTasks: 'Search tasks...',
    totalTasks: 'Total Tasks',
    completed: 'Completed',
    taskProgress: 'Progress',
    all: 'All',
    noDueDate: 'No due date',
    min: 'min',
    editTask: 'Edit Task',
    addNewTask: 'Add New Task',
    subject: 'Subject',
    enterSubject: 'Enter subject',
    dueDate: 'Due Date',
    estimatedTime: 'Estimated Time',
    enterTimeInMinutes: 'Enter time in minutes',
    priority: 'Priority',
    cancel: 'Cancel',
    update: 'Update',
    add: 'Add',
    task: 'Task',
    delete: 'Delete',
    deleteTask: 'Delete Task',
    deleteTaskConfirm: 'Are you sure you want to delete this task?',
    
    // Timer
    focusTimer: 'FocusFlow Timer',
    generalTimer: 'General Timer',
    teaBreak: 'Tea Break',
    lunchBreak: 'Lunch Break',
    stayFocused: 'Stay focused, stay productive',
    enjoyYourTea: 'Enjoy your tea time',
    enjoyYourMeal: 'Enjoy your meal time',
    pomodoro: 'Pomodoro',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    focusTime: 'Focus Time',
    breakTime: 'Break Time',
    elapsedTime: 'Elapsed Time',
    teaTime: 'Tea Time',
    lunchTime: 'Lunch Time',
    pomodoros: 'Pomodoros',
    sessions: 'Sessions',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
    totalFocus: 'Total Focus',
    setTimerDuration: 'Set Timer Duration',
    setTimer: 'Set Timer',
    timerComplete: 'Timer Complete!',
    sessionFinished: 'session finished.',
    sessionSaved: 'Session Saved',
    sessionSavedMessage: 'session has been saved.',
    timerRunning: 'Timer Running',
    stopTimerFirst: 'Please stop the timer first.',
    recentSessions: 'Recent Sessions',
    timerSession: 'Timer Session',
    
    // Stats
    progress: 'Track your progress',
    todayStudy: "Today's Study",
    thisWeek: 'This Week',
    monthlyGoal: 'Monthly Goal',
    dayStreak: 'Day Streak',
    weeklyOverview: 'Weekly Overview',
    subjectDistribution: 'Subject Distribution',
    timeDistribution: 'Time Distribution',
    recentAchievements: 'Recent Achievements',
    noStudyDataYet: 'No study data yet',
    startStudyingToSeeStats: 'Start studying to see statistics',
    dayStreakAchievement: ' day streak',
    current: 'Current',
    notStarted: 'Not started',
    hoursThisWeek: ' hours this week',
    monthlyProgress: 'monthly progress',
    hoursToday: ' hours today',
    today: 'Today',
    
    // Exam Management
    examManagement: 'Exam Management',
    manageExams: 'Manage Your Exams',
    manageExamsDesc: 'Add, edit, or delete your upcoming exams',
    noExams: 'No Exams Yet',
    noExamsDesc: 'Add your first exam to start tracking',
    addNewExam: 'Add New Exam',
    editExam: 'Edit Exam',
    deleteExam: 'Delete Exam',
    deleteExamConfirm: 'Are you sure you want to delete this exam?',
    editGrades: 'Edit Grades',
    
    // Subject Grades
    subjectGrades: 'Subject Grades',
    targetPercentile: 'Target Percentile',
    averagePercentile: 'Average Percentile',
    recentPercentile: 'Recent Percentile',
    examTypeLabel: 'Exam Type',
    mockTest: 'Mock Test',
    midterm: 'Midterm',
    finalExam: 'Final Exam',
    mockTests: 'Mock Tests',
    midtermTests: 'Mid Term Tests',
    finalTests: 'Final Tests',
    mockTestGrades: 'Mock Test Grades',
    midtermGrades: 'Midterm Grades',
    finalGrades: 'Final Grades',
    gradeHistory: 'Grade History',
    mockShort: 'Mock',
    midtermShort: 'Mid',
    finalShort: 'Final',
    grade1: 'Grade 1',
    grade2: 'Grade 2',
    grade3: 'Grade 3',
    grade4: 'Grade 4',
    grade5: 'Grade 5',
    grade6: 'Grade 6',
    grade7: 'Grade 7',
    grade8: 'Grade 8',
    grade9: 'Grade 9',
    noGrade: 'TBD',
    deleteGrade: 'Delete Grade',
    deleteGradeConfirm: 'Are you sure you want to delete this subject grade?',
    addSubject: 'Add Subject',
    enterSubjectName: 'Enter subject name',
    subjectName: 'Subject Name',
    arts: 'Arts & PE',
    noSubjectsAdded: 'No subjects added',
    subjectAlreadyExists: 'Subject already exists',
    failedToUpdateGrade: 'Failed to update grade',
    failedToDeleteGrade: 'Failed to delete grade',
    failedToAddSubject: 'Failed to add subject',
    testTypes: 'Test Types',
    tests: 'tests',
    latestGrade: 'Latest Grade',
    noTestsFound: 'No tests found',
    addTestsToGetStarted: 'Add tests to get started',
    subjects: 'Subjects',
    noSubjectsFound: 'No subjects found',
    takeTestsToSeeSubjects: 'Take tests to see subjects',
    noGradesYet: 'No grades yet',
    addFirstTest: 'Add your first test',
    addTest: 'Add Test',
    addNewTest: 'Add New Test',
    testName: 'Test Name',
    testDate: 'Test Date',
    optional: 'optional',
    create: 'Create',
    creating: 'Creating',
    enterTestName: 'Enter test name',
    failedToCreateTest: 'Failed to create test',
    uploadAnswerSheet: 'Upload Answer Sheet',
    createSubject: 'Create Subject',
    editSubject: 'Edit Subject',
    deleteSubject: 'Delete Subject',
    deleteSubjectConfirmation: 'This will delete all test data related to this subject. Do you want to continue?',
    failedToDeleteSubject: 'Failed to delete subject',
    failedToUpdateSubject: 'Failed to update subject',
    subjectOptions: 'Subject Options',
    chooseAction: 'Choose an action',
    edit: 'Edit',
    updating: 'Updating',
    testDetail: 'Test Detail',
    answerSheet: 'Answer Sheet',
    uploadDescription: 'Upload your answer sheet photo to get automatic grade analysis',
    takePhoto: 'Take Photo',
    chooseFromLibrary: 'Choose from Library',
    analyzing: 'Analyzing',
    analyzeResults: 'Analyze Results',
    analysisError: 'An error occurred during analysis',
    testResultSubmitted: 'Test result submitted successfully',
    permissionRequired: 'Permission required',
    cameraPermissionRequired: 'Camera permission required',
    success: 'Success',

    newAnswerKeyTitle: 'New Answer Key',
    templateName: 'Template Name',
    templateNamePlaceholder: 'e.g. Math Mock Test A',
    subjectLabel: 'Subject',
    mathematics: 'Mathematics',
    others: 'Others',
    answerKeyTestType: 'Test Type',
    questions: 'Questions',
    mcq: 'MCQ',
    textQuestion: 'Text',
    total: 'Total',
    answerKeys: 'Answer Keys',
    searchTemplates: 'Search templates',
    adminOnlyCreationHint: 'Admin-only creation. Please sign in with admin.',
    failedToLoad: 'Failed to load',
    practice: 'Practice',
    mock: 'Mock',
    final: 'Final',
    qsShort: 'Qs',
    answerKeySaved: 'Answer key saved',
    templateUpdated: 'Template updated',
    saveTemplate: 'Save Template',
    deleteAnswerKey: 'Delete Answer Key',
    deleteAnswerKeyConfirm: 'Are you sure you want to delete this answer key?',
    failedToDelete: 'Failed to delete',
  },
};

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('ko');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Delay language loading to prevent hydration timeout
    const timer = setTimeout(() => {
      loadLanguage();
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const loadLanguage = async () => {
    try {
      // Add timeout to AsyncStorage operation
      const storagePromise = AsyncStorage.getItem('language');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Language storage timeout')), 1000)
      );
      
      const savedLanguage = await Promise.race([storagePromise, timeoutPromise]) as string | null;
      
      if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
        setLanguage(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
      // Use default language on error
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = useCallback(async (newLanguage: Language) => {
    try {
      // Update state immediately
      setLanguage(newLanguage);
      
      // Save to storage asynchronously without blocking
      AsyncStorage.setItem('language', newLanguage).catch(error => {
        console.error('Failed to save language:', error);
      });
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  const translateText = useCallback(async (text: string, targetLanguage?: Language): Promise<string> => {
    try {
      const target = targetLanguage || (language === 'ko' ? 'en' : 'ko');
      
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the given text to ${target === 'ko' ? 'Korean' : 'English'}. Only return the translated text, nothing else.`
            },
            {
              role: 'user',
              content: text
            }
          ]
        })
      });

      const data = await response.json();
      return data.completion || text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  }, [language]);

  return useMemo(() => ({
    language,
    changeLanguage,
    t,
    translateText,
    isLoading,
  }), [language, changeLanguage, t, translateText, isLoading]);
});