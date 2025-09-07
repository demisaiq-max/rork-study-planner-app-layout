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
    priorityTasksTitle: '우선 순위 3가지',
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
    progress: '진행률',
    all: '전체',
    noDueDate: '마감일 없음',
    min: '분',
    editTask: '할 일 수정',
    addNewTask: '새 할 일 추가',
    subject: '과목',
    enterSubject: '과목 입력',
    dueDate: '마감일',
    estimatedTime: '예상 시간',
    minutes: '분',
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
    stayFocused: '집중하고, 생산적으로',
    pomodoro: '뽀모도로',
    shortBreak: '짧은 휴식',
    longBreak: '긴 휴식',
    focusTime: '집중 시간',
    breakTime: '휴식 시간',
    pomodoros: '뽀모도로',
    hours: '시간',
    totalFocus: '총 집중 시간',
    
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
    progress: 'Progress',
    all: 'All',
    noDueDate: 'No due date',
    min: 'min',
    editTask: 'Edit Task',
    addNewTask: 'Add New Task',
    subject: 'Subject',
    enterSubject: 'Enter subject',
    dueDate: 'Due Date',
    estimatedTime: 'Estimated Time',
    minutes: 'minutes',
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
    stayFocused: 'Stay focused, stay productive',
    pomodoro: 'Pomodoro',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    focusTime: 'Focus Time',
    breakTime: 'Break Time',
    pomodoros: 'Pomodoros',
    hours: 'h',
    totalFocus: 'Total Focus',
    
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
  },
};

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('ko');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
        setLanguage(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = useCallback(async (newLanguage: Language) => {
    try {
      setLanguage(newLanguage);
      await AsyncStorage.setItem('language', newLanguage);
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