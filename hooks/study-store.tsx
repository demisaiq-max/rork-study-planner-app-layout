import { useState, useEffect, useMemo, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  subject?: string;
  dueDate?: string;
  estimatedTime?: number;
  priority?: "high" | "medium" | "low";
  description?: string;
}

interface PriorityTask {
  title: string;
  description?: string;
}

interface BrainDumpItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

interface DDay {
  id: string;
  title: string;
  date: string;
  daysLeft: number;
  description?: string;
  priority?: "high" | "medium" | "low";
}

interface StudyData {
  tasks: Task[];
  dDays: DDay[];
  todayStudyTime: number;
  targetStudyTime: number;
  weeklyStudyTime: number;
  monthlyGoal: number;
  subjects: string[];
  subjectGrades: Record<string, number>;
  visibleSubjects: string[];
  priorityTasks: PriorityTask[];
  brainDumpItems: BrainDumpItem[];
}

const STORAGE_KEY = "focusflow_study_data";

const defaultData: StudyData = {
  tasks: [
    { id: "1", title: "아침 조정하기", completed: false, priority: "high" },
    { id: "2", title: "2025년 6월 모의고사 풀기", completed: false, subject: "수학" },
    { id: "3", title: "학원가기", completed: true },
    { id: "4", title: "자이스토리 325p까지 풀기", completed: false, subject: "영어" },
    { id: "5", title: "ebs 수능특강 강의 듣기", completed: false, subject: "국어" },
    { id: "6", title: "ebs 수능특강 강의 듣기", completed: false, subject: "과학" },
    { id: "7", title: "ebs 수능특강 강의 듣기", completed: false, subject: "사회" },
  ],
  dDays: [
    { id: "1", title: "대학수학능력시험", date: "2025.11.13", daysLeft: 180, description: "National college entrance exam", priority: "high" },
    { id: "2", title: "9월 모의평가", date: "2025.09.15", daysLeft: 21, description: "September mock exam", priority: "medium" },
  ],
  todayStudyTime: 185,
  targetStudyTime: 360,
  weeklyStudyTime: 28,
  monthlyGoal: 150,
  subjects: ["국어", "영어", "수학", "탐구"],
  subjectGrades: {
    "국어": 3,
    "영어": 2,
    "수학": 1,
    "탐구": 2
  },
  visibleSubjects: ["국어", "영어", "수학"],
  priorityTasks: [
    { title: "아침 조정하기" },
    { title: "2025년 6월 모의고사 풀기" },
    { title: "학원가기" }
  ],
  brainDumpItems: [
    { id: "1", title: "Morning Adjustment", completed: false, createdAt: new Date().toISOString() },
    { id: "2", title: "자이스토리 325p까지 풀기", completed: false, createdAt: new Date().toISOString() },
    { id: "3", title: "ebs 수능특강 강의 듣기", completed: false, createdAt: new Date().toISOString() },
    { id: "4", title: "ebs 수능특강 강의 듣기", completed: false, createdAt: new Date().toISOString() },
    { id: "5", title: "ebs 수능특강 강의 듣기", completed: false, createdAt: new Date().toISOString() },
    { id: "6", title: "vfdv", completed: false, createdAt: new Date().toISOString() },
    { id: "7", title: "dsf", completed: false, createdAt: new Date().toISOString() },
    { id: "8", title: "dfg", completed: false, createdAt: new Date().toISOString() },
    { id: "9", title: "gdfgdf", completed: false, createdAt: new Date().toISOString() }
  ],
};

export const [StudyProvider, useStudyStore] = createContextHook(() => {
  const [data, setData] = useState<StudyData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        // Ensure all required properties exist
        const mergedData = {
          ...defaultData,
          ...parsedData,
          priorityTasks: parsedData.priorityTasks || [],
          visibleSubjects: parsedData.visibleSubjects || defaultData.visibleSubjects,
          subjects: parsedData.subjects || defaultData.subjects,
          subjectGrades: parsedData.subjectGrades || defaultData.subjectGrades,
          brainDumpItems: parsedData.brainDumpItems || defaultData.brainDumpItems,
        };
        setData(mergedData);
      }
    } catch (error) {
      console.error("Failed to load study data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newData: StudyData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error("Failed to save study data:", error);
    }
  };

  const toggleTask = useCallback((taskId: string) => {
    const updatedTasks = data.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    saveData({ ...data, tasks: updatedTasks });
  }, [data]);

  const addTask = useCallback((task: Omit<Task, "id">) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
    };
    saveData({ ...data, tasks: [...data.tasks, newTask] });
  }, [data]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const updatedTasks = data.tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    saveData({ ...data, tasks: updatedTasks });
  }, [data]);

  const deleteTask = useCallback((taskId: string) => {
    const updatedTasks = data.tasks.filter(task => task.id !== taskId);
    saveData({ ...data, tasks: updatedTasks });
  }, [data]);

  const updateStudyTime = useCallback((minutes: number) => {
    saveData({ ...data, todayStudyTime: data.todayStudyTime + minutes });
  }, [data]);

  const addDDay = useCallback((dDay: Omit<DDay, "id">) => {
    const newDDay: DDay = {
      ...dDay,
      id: Date.now().toString(),
    };
    saveData({ ...data, dDays: [...data.dDays, newDDay] });
  }, [data]);

  const updateDDay = useCallback((dDayId: string, updates: Partial<DDay>) => {
    const updatedDDays = data.dDays.map(dDay =>
      dDay.id === dDayId ? { ...dDay, ...updates } : dDay
    );
    saveData({ ...data, dDays: updatedDDays });
  }, [data]);

  const removeDDay = useCallback((dDayId: string) => {
    const updatedDDays = data.dDays.filter(dDay => dDay.id !== dDayId);
    saveData({ ...data, dDays: updatedDDays });
  }, [data]);

  const toggleSubjectVisibility = useCallback((subject: string) => {
    const currentVisibleSubjects = data.visibleSubjects || [];
    const updatedVisibleSubjects = currentVisibleSubjects.includes(subject)
      ? currentVisibleSubjects.filter(s => s !== subject)
      : [...currentVisibleSubjects, subject];
    saveData({ ...data, visibleSubjects: updatedVisibleSubjects });
  }, [data]);

  const addPriorityTask = useCallback((task: PriorityTask) => {
    const currentPriorityTasks = data.priorityTasks || [];
    if (currentPriorityTasks.length >= 3) return;
    saveData({ ...data, priorityTasks: [...currentPriorityTasks, task] });
  }, [data]);

  const removePriorityTask = useCallback((index: number) => {
    const currentPriorityTasks = data.priorityTasks || [];
    const updatedPriorityTasks = currentPriorityTasks.filter((_, i) => i !== index);
    saveData({ ...data, priorityTasks: updatedPriorityTasks });
  }, [data]);

  const addBrainDumpItem = useCallback((title: string) => {
    const newItem: BrainDumpItem = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const currentItems = data.brainDumpItems || [];
    saveData({ ...data, brainDumpItems: [...currentItems, newItem] });
  }, [data]);

  const updateBrainDumpItem = useCallback((id: string, title: string) => {
    const currentItems = data.brainDumpItems || [];
    const updatedItems = currentItems.map(item =>
      item.id === id ? { ...item, title } : item
    );
    saveData({ ...data, brainDumpItems: updatedItems });
  }, [data]);

  const deleteBrainDumpItem = useCallback((id: string) => {
    const currentItems = data.brainDumpItems || [];
    const updatedItems = currentItems.filter(item => item.id !== id);
    saveData({ ...data, brainDumpItems: updatedItems });
  }, [data]);

  const toggleBrainDumpItem = useCallback((id: string) => {
    const currentItems = data.brainDumpItems || [];
    const updatedItems = currentItems.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveData({ ...data, brainDumpItems: updatedItems });
  }, [data]);

  const updateSubjectGrade = useCallback((subject: string, grade: number) => {
    const updatedGrades = {
      ...data.subjectGrades,
      [subject]: grade
    };
    saveData({ ...data, subjectGrades: updatedGrades });
  }, [data]);

  return useMemo(() => ({
    ...data,
    isLoading,
    toggleTask,
    addTask,
    updateTask,
    deleteTask,
    updateStudyTime,
    addDDay,
    updateDDay,
    removeDDay,
    toggleSubjectVisibility,
    updateSubjectGrade,
    addPriorityTask,
    removePriorityTask,
    addBrainDumpItem,
    updateBrainDumpItem,
    deleteBrainDumpItem,
    toggleBrainDumpItem,
  }), [data, isLoading, toggleTask, addTask, updateTask, deleteTask, updateStudyTime, addDDay, updateDDay, removeDDay, toggleSubjectVisibility, updateSubjectGrade, addPriorityTask, removePriorityTask, addBrainDumpItem, updateBrainDumpItem, deleteBrainDumpItem, toggleBrainDumpItem]);
});